import {
    EstimatedHourlyDemand,
    getDemandLabel,
    getDemandLevel,
    StationDailyDemand,
    StationExit,
    StationWithDemand,
    TimeWindow,
    WeatherSummary,
} from "@/types";
import {
    MOCK_EXITS,
    MOCK_STATIONS_WITH_DEMAND,
    MOCK_WEATHER,
} from "@/data/mock";
import { computeBestTimeWindow, formatHour } from "@/lib/utils";
import fs from "node:fs";
import path from "node:path";

export interface StationInsightData {
    station: StationWithDemand;
    baselineEntries: number;
    trend: StationDailyDemand[];
    hourly: EstimatedHourlyDemand[];
    timeWindow: TimeWindow;
    rushWindowLabel: string;
    bestTimeLabel: string;
    bestExits: StationExit[];
    weatherEffect: WeatherSummary;
}

const TREND_FACTORS: number[] = [
    0.88, 0.92, 0.95, 0.98, 1.01, 1.04, 1.07, 1.02, 0.99, 0.96, 0.93, 0.97, 1.03, 1.05,
];

const COMMUTER_SHARES: number[] = [
    0.02, 0.04, 0.06, 0.09, 0.1, 0.08, 0.06, 0.05, 0.04, 0.05, 0.07, 0.1, 0.11, 0.09,
    0.07, 0.04, 0.02, 0.01,
];

const CENTRAL_SHARES: number[] = [
    0.01, 0.02, 0.04, 0.06, 0.07, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.09, 0.09, 0.08,
    0.07, 0.05, 0.03, 0.02,
];

const CSV_FILES = ["passenger_2025.csv", "passenger_2026.csv"];

const NAME_TO_SLUG: Record<string, string> = {
    "20yanvar": "20-yanvar",
    "28may": "28-may",
    "28mayst": "28-may",
    "8noyabr": "8-noyabr",
    "sahil": "sahil",
    "ganjlik": "ganjlik",
    "azadligprospekti": "azadliq-prospekti",
    "azadliqprospekti": "azadliq-prospekti",
    "narimannarimanov": "nariman-narimanov",
    "bakmil": "bakmil",
    "ulduz": "ulduz",
    "koroglu": "koroglu",
    "koroghlu": "koroglu",
    "haziaslanov": "hazi-aslanov",
    "darnagul": "darnagul",
    "avtovagzal": "avtovagzal",
    "avtovaghzal": "avtovagzal",
    "memarajami": "memar-ajami",
    "memarajami2": "memar-ajami-2",
    "nizami": "nizami",
    "nasimi": "nasimi",
    "neftciler": "neftchilar",
    "neftchilar": "neftchilar",
    "garaqarayev": "qara-qarayev",
    "qaraqarayev": "qara-qarayev",
    "elmlerakademiyasi": "elmler-akademiyasi",
    "elmlarakademiyasi": "elmler-akademiyasi",
    "inshaatchilar": "inshaatchilar",
    "xalqlardostlugu": "khalglar-dostlugu",
    "khalglardostlughu": "khalglar-dostlugu",
    "ahmedli": "ahmedli",
    "akhmedli": "ahmedli",
    "xocesen": "hojasan",
    "khocasen": "hojasan",
    "xetai": "khatai",
    "khatai": "khatai",
    "icheriseher": "icheri-sheher",
    "icherisheher": "icheri-sheher",
    "icheriseherst": "icheri-sheher",
    "cafercabbarli": "jafar-cabbarli",
    "jafarjabbarli": "jafar-cabbarli",
};

interface CsvAggregateState {
    bySlugAndDate: Map<string, number>;
    unknownStationNames: Set<string>;
}

interface RealDemandData {
    trendBySlug: Map<string, StationDailyDemand[]>;
    baselineBySlug: Map<string, number>;
    latestEntriesBySlug: Map<string, number>;
}

let cachedRealDemandData: RealDemandData | null = null;

function normalizeStationName(raw: string): string {
    const azMap: Record<string, string> = {
        "ə": "e",
        "Ə": "e",
        "ı": "i",
        "İ": "i",
        "ö": "o",
        "Ö": "o",
        "ü": "u",
        "Ü": "u",
        "ş": "s",
        "Ş": "s",
        "ç": "c",
        "Ç": "c",
        "ğ": "g",
        "Ğ": "g",
    };

    const transliterated = raw
        .trim()
        .replace(/[əƏıİöÖüÜşŞçÇğĞ]/g, (m) => azMap[m] ?? m)
        .toLowerCase();

    return transliterated.replace(/[^a-z0-9]/g, "");
}

function parseIsoDate(raw: string): string | null {
    const dateOnly = raw.trim().split(" ")[0] ?? "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return null;
    return dateOnly;
}

function resolveSlugByStationName(stationName: string): string | null {
    const key = normalizeStationName(stationName);
    return NAME_TO_SLUG[key] ?? null;
}

function loadCsvAggregate(): CsvAggregateState {
    const state: CsvAggregateState = {
        bySlugAndDate: new Map<string, number>(),
        unknownStationNames: new Set<string>(),
    };

    for (const fileName of CSV_FILES) {
        const filePath = path.join(process.cwd(), fileName);
        if (!fs.existsSync(filePath)) continue;

        const content = fs.readFileSync(filePath, "utf8");
        const lines = content.split(/\r?\n/);

        for (let i = 1; i < lines.length; i += 1) {
            const line = lines[i]?.trim();
            if (!line) continue;

            const parts = line.split(";");
            if (parts.length < 3) continue;

            const rawDate = parts[0] ?? "";
            const rawStation = (parts[1] ?? "").replace(/^"|"$/g, "").trim();
            const rawEntries = parts[2] ?? "";

            const date = parseIsoDate(rawDate);
            const slug = resolveSlugByStationName(rawStation);
            const entries = Number(rawEntries.replace(/[^\d.-]/g, ""));

            if (!date || !Number.isFinite(entries) || entries < 0) continue;
            if (!slug) {
                state.unknownStationNames.add(rawStation);
                continue;
            }

            const key = `${slug}|${date}`;
            const previous = state.bySlugAndDate.get(key) ?? 0;
            state.bySlugAndDate.set(key, previous + Math.round(entries));
        }
    }

    return state;
}

function toRealDemandData(): RealDemandData {
    if (cachedRealDemandData) return cachedRealDemandData;

    const aggregate = loadCsvAggregate();
    const trendBySlug = new Map<string, StationDailyDemand[]>();
    const latestEntriesBySlug = new Map<string, number>();
    const baselineBySlug = new Map<string, number>();

    for (const [compositeKey, entries] of aggregate.bySlugAndDate.entries()) {
        const [slug, date] = compositeKey.split("|");
        if (!slug || !date) continue;

        const station = MOCK_STATIONS_WITH_DEMAND.find((s) => s.slug === slug);
        if (!station) continue;

        const current = trendBySlug.get(slug) ?? [];
        current.push({
            date,
            stationId: station.id,
            entries,
            sourceYear: Number(date.slice(0, 4)),
            createdAt: new Date().toISOString(),
        });
        trendBySlug.set(slug, current);
    }

    for (const [slug, trend] of trendBySlug.entries()) {
        trend.sort((a, b) => a.date.localeCompare(b.date));
        const latest = trend[trend.length - 1]?.entries ?? 0;
        const baselineSample = trend.slice(Math.max(0, trend.length - 31), -1);
        const baselineSource = baselineSample.length > 0 ? baselineSample : trend.slice(0, -1);
        const baseline =
            baselineSource.length > 0
                ? Math.round(
                    baselineSource.reduce((sum, row) => sum + row.entries, 0) / baselineSource.length
                )
                : latest;

        latestEntriesBySlug.set(slug, latest);
        baselineBySlug.set(slug, baseline);
    }

    cachedRealDemandData = {
        trendBySlug,
        baselineBySlug,
        latestEntriesBySlug,
    };

    return cachedRealDemandData;
}

function enrichStationWithRealData(station: StationWithDemand): StationWithDemand {
    const realData = toRealDemandData();
    const latest = realData.latestEntriesBySlug.get(station.slug);
    const baseline = realData.baselineBySlug.get(station.slug);

    if (latest == null || baseline == null || baseline <= 0) {
        return station;
    }

    const demandDelta = Math.round(((latest - baseline) / baseline) * 100);

    return {
        ...station,
        todayEntries: latest,
        forecastEntries: latest,
        demandDelta,
        demandLevel: getDemandLevel(demandDelta),
        demandLabel: getDemandLabel(demandDelta),
    };
}

export function getAllStations(): StationWithDemand[] {
    return [...MOCK_STATIONS_WITH_DEMAND]
        .map((station) => {
            const enriched = enrichStationWithRealData(station);
            return {
                ...enriched,
                demandLevel: getDemandLevel(enriched.demandDelta),
                demandLabel: getDemandLabel(enriched.demandDelta),
            };
        })
        .sort(
        (a, b) => (b.forecastEntries ?? 0) - (a.forecastEntries ?? 0)
        );
}

export function getTopStations(limit = 5): StationWithDemand[] {
    return getAllStations().slice(0, limit);
}

export function getStationBySlug(slug: string): StationWithDemand | undefined {
    return getAllStations().find((station) => station.slug === slug);
}

export function getWeatherSummary(): WeatherSummary {
    const demandEffect =
        MOCK_WEATHER.condition === "rain" || MOCK_WEATHER.condition === "heavy_rain"
            ? "increase"
            : MOCK_WEATHER.windSpeed > 35
                ? "increase"
                : "neutral";

    return {
        current: MOCK_WEATHER,
        demandEffect,
        effectMagnitude: demandEffect === "neutral" ? "low" : "medium",
        riderFacingNote:
            demandEffect === "neutral"
                ? "Stable weather suggests station demand should stay close to baseline today."
                : "Weather pressure can shift more riders to metro in peak windows.",
    };
}

export function getStationInsight(slug: string): StationInsightData | null {
    const station = getStationBySlug(slug);
    if (!station || !station.forecastEntries) return null;

    const baselineEntries = Math.round(
        station.forecastEntries / (1 + station.demandDelta / 100)
    );
    const trend = buildTrend(station.id, baselineEntries);
    const hourly = buildHourlyEstimate(station, station.forecastEntries);
    const computed = computeBestTimeWindow(hourly);

    const fallbackTimeWindow: TimeWindow = {
        rushStart: 8,
        rushEnd: 10,
        quietStart: 11,
        quietEnd: 13,
        bestTimeToEnter: 11,
        label: "Best time to enter: around 11:00 AM",
    };

    const timeWindow = computed
        ? {
            rushStart: computed.rushStart,
            rushEnd: computed.rushEnd,
            quietStart: computed.quietStart,
            quietEnd: computed.quietEnd,
            bestTimeToEnter: computed.bestTimeToEnter,
            label: computed.label,
        }
        : fallbackTimeWindow;

    return {
        station,
        baselineEntries,
        trend,
        hourly,
        timeWindow,
        rushWindowLabel: `${formatHour(timeWindow.rushStart)} to ${formatHour(
            timeWindow.rushEnd
        )}`,
        bestTimeLabel: formatHour(timeWindow.bestTimeToEnter),
        bestExits: getBestExits(station.id),
        weatherEffect: getWeatherSummary(),
    };
}

function buildTrend(stationId: string, baselineEntries: number): StationDailyDemand[] {
    const station = MOCK_STATIONS_WITH_DEMAND.find((item) => item.id === stationId);
    const slug = station?.slug;
    if (slug) {
        const realTrend = toRealDemandData().trendBySlug.get(slug);
        if (realTrend && realTrend.length > 0) {
            return realTrend.slice(-60);
        }
    }

    return TREND_FACTORS.map((factor, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (TREND_FACTORS.length - index));

        return {
            date: date.toISOString().slice(0, 10),
            stationId,
            entries: Math.round(baselineEntries * factor),
            sourceYear: 2025,
            createdAt: new Date().toISOString(),
        };
    });
}

function buildHourlyEstimate(
    station: StationWithDemand,
    forecastEntries: number
): EstimatedHourlyDemand[] {
    const shares =
        station.stationType === "central" || station.stationType === "business"
            ? CENTRAL_SHARES
            : COMMUTER_SHARES;

    return shares.map((share, index) => {
        const hour = index + 6;
        const estimatedEntries = Math.round(forecastEntries * share);
        const isRush = hour === 8 || hour === 9 || hour === 18 || hour === 19;

        return {
            hour,
            estimatedEntries,
            isRush,
            label: isRush ? "Rush window" : "Off-peak",
        };
    });
}

function getBestExits(stationId: string): StationExit[] {
    const exits = MOCK_EXITS.filter((exit) => exit.stationId === stationId);
    if (exits.length > 0) {
        return exits.slice(0, 3);
    }

    return [
        {
            id: `${stationId}-exit-1`,
            stationId,
            exitNo: 1,
            exitLabel: "Exit 1",
            addressText: "Main street access",
            lat: 40.4,
            lon: 49.85,
            isAccessible: true,
            notes: "Balanced walking distance and lower queue risk.",
        },
        {
            id: `${stationId}-exit-2`,
            stationId,
            exitNo: 2,
            exitLabel: "Exit 2",
            addressText: "Bus stop side",
            lat: 40.4,
            lon: 49.851,
            isAccessible: false,
            notes: "Faster interchange for bus connections.",
        },
    ];
}
