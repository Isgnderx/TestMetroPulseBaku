import {
    generateMockForecasts,
    MOCK_WEATHER,
} from "@/data/mock";
import {
    computeBestTimeWindow,
    enrichForecast,
    formatHour,
} from "@/lib/utils";
import {
    getAllStations,
    getStationBySlug,
    getStationInsight,
    getWeatherSummary,
} from "@/lib/mock/station-demand";
import {
    ForecastWithContext,
    getDemandLabel,
    getDemandLevel,
    IntradayProfileType,
    LeaderboardFilter,
    LeaderboardResponse,
    ScoredExit,
    StationWithDemand,
} from "@/types";

function scoreExits(
    exits: ScoredExit[],
    destination?: { lat: number; lon: number }
): ScoredExit[] {
    if (!destination) {
        return exits
            .map((exit, index) => ({ ...exit, score: index + 1 }))
            .sort((a, b) => a.score - b.score);
    }

    const toRad = (value: number) => (value * Math.PI) / 180;
    const distance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const earthRadiusM = 6371000;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        return Math.round(2 * earthRadiusM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    };

    return exits
        .map((exit) => {
            const distanceMeters = distance(destination.lat, destination.lon, exit.lat, exit.lon);
            return {
                ...exit,
                distanceMeters,
                score: distanceMeters,
            };
        })
        .sort((a, b) => a.score - b.score)
        .map((exit, index) => ({
            ...exit,
            tag:
                index === 0
                    ? "closest"
                    : index === 1
                        ? "balanced"
                        : index === 2
                            ? "least-crowded"
                            : undefined,
        }));
}

export function getStationsPayload() {
    const stations = getAllStations();
    return { stations };
}

export function getStationDetailPayload(slug: string) {
    const station = getStationBySlug(slug);
    if (!station) return null;

    const baselineEntries = Math.round(
        (station.forecastEntries ?? 0) / (1 + station.demandDelta / 100)
    );

    return {
        station,
        baselineEntries,
        latestForecastEntries: station.forecastEntries ?? 0,
        latestDeltaPercent: station.demandDelta,
        latestDemandLabel: station.demandLabel,
    };
}

export function getStationHistoryPayload(slug: string) {
    const insight = getStationInsight(slug);
    if (!insight) return null;

    return {
        station: {
            id: insight.station.id,
            slug: insight.station.slug,
            name: insight.station.name,
        },
        history: insight.trend,
    };
}

export function getStationForecastPayload(slug: string) {
    const station = getStationBySlug(slug);
    if (!station) return null;

    const forecast: ForecastWithContext[] = generateMockForecasts(station.id, 7).map((item) =>
        enrichForecast(item)
    );

    return {
        station: {
            id: station.id,
            slug: station.slug,
            name: station.name,
        },
        forecast,
        explanation: {
            summary: "Forecast is based on station-entry history, baseline trend, and weather-informed features.",
            weatherSummary: "This explanation is generated from deterministic template logic in fallback mode.",
            source: "template" as const,
        },
    };
}

export function getStationBestTimePayload(slug: string) {
    const insight = getStationInsight(slug);
    if (!insight) return null;

    const bestWindow = computeBestTimeWindow(insight.hourly);
    if (!bestWindow) return null;

    const profileType: IntradayProfileType =
        insight.station.stationType === "commuter" || insight.station.stationType === "transfer"
            ? "commuter-heavy"
            : insight.station.stationType === "residential"
                ? "residential"
                : insight.station.stationType === "central" || insight.station.stationType === "business"
                    ? "central"
                    : "mixed-use";

    return {
        station: {
            id: insight.station.id,
            slug: insight.station.slug,
            name: insight.station.name,
        },
        profileType,
        operatingHours: {
            startHour: 6,
            endHour: 23,
        },
        estimatedHourly: insight.hourly,
        bestTimeToEnterHour: bestWindow.bestTimeToEnter,
        rushWindow: {
            startHour: bestWindow.rushStart,
            endHour: bestWindow.rushEnd,
        },
        quietWindow: {
            startHour: bestWindow.quietStart,
            endHour: bestWindow.quietEnd,
        },
        estimatedCrowdWindowLabel: `${formatHour(bestWindow.rushStart)} to ${formatHour(bestWindow.rushEnd)}`,
        likelyQuieterPeriodLabel: `${formatHour(bestWindow.quietStart)} to ${formatHour(bestWindow.quietEnd)}`,
        bestTimeToEnterLabel: formatHour(bestWindow.bestTimeToEnter),
        methodologyNote:
            "Estimated from daily station totals and profile templates. Not observed per-hour turnstile counts.",
    };
}

export function getStationBestExitsPayload(
    slug: string,
    destination?: { lat: number; lon: number }
) {
    const insight = getStationInsight(slug);
    if (!insight) return null;

    const baseExits: ScoredExit[] = insight.bestExits.map((exit, index) => ({
        ...exit,
        score: index + 1,
        tag:
            index === 0
                ? "closest"
                : index === 1
                    ? "balanced"
                    : "least-crowded",
    }));

    const rankedExits = scoreExits(baseExits, destination);
    const closestExit = rankedExits[0] ?? null;
    const balancedExit = rankedExits.find((exit) => exit.tag === "balanced") ?? rankedExits[1] ?? closestExit;
    const leastCrowdedExit =
        rankedExits.find((exit) => exit.tag === "least-crowded") ?? rankedExits[2] ?? balancedExit;

    return {
        station: {
            id: insight.station.id,
            slug: insight.station.slug,
            name: insight.station.name,
        },
        destination,
        scoringMode: "straight-line-distance" as const,
        recommendations: {
            closestExit,
            balancedExit,
            leastCrowdedExit,
        },
        exits: rankedExits,
        methodologyNote:
            "Fallback exit ranking uses straight-line proximity and static scoring hints. It does not reconstruct full journeys.",
    };
}

export function getLeaderboardPayload(filter: LeaderboardFilter = "all") {
    const stations = getAllStations();

    const entries = stations
        .map((station, index) => {
            const baseline = Math.round((station.forecastEntries ?? 0) / (1 + station.demandDelta / 100));

            return {
                rank: index + 1,
                station: {
                    id: station.id,
                    slug: station.slug,
                    name: station.name,
                    nameAz: station.nameAz,
                    line: station.line,
                    lat: station.lat,
                    lon: station.lon,
                    stationType: station.stationType,
                    openedYear: station.openedYear,
                    createdAt: station.createdAt,
                    updatedAt: station.updatedAt,
                },
                todayForecast: station.forecastEntries ?? 0,
                baseline,
                deltaPercent: station.demandDelta,
                demandLevel: getDemandLevel(station.demandDelta),
                demandLabel: getDemandLabel(station.demandDelta),
            };
        })
        .sort((a, b) => b.todayForecast - a.todayForecast)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

    const filtered = applyLeaderboardFilter(entries, filter);

    const leaderboard: LeaderboardResponse = {
        date: new Date().toISOString().slice(0, 10),
        entries: filtered,
        filter,
    };

    return {
        leaderboard,
        filter,
    };
}

export function getCurrentWeatherPayload() {
    const summary = getWeatherSummary();

    return {
        weather: MOCK_WEATHER,
        demandInsight: summary.riderFacingNote,
    };
}

function applyLeaderboardFilter(
    entries: LeaderboardResponse["entries"],
    filter: LeaderboardFilter
): LeaderboardResponse["entries"] {
    if (filter === "all") return entries;
    if (filter === "busier") return entries.filter((entry) => entry.deltaPercent > 10);
    if (filter === "quieter") return entries.filter((entry) => entry.deltaPercent < -10);
    if (filter === "surge") return entries.filter((entry) => entry.demandLevel === "surge");
    if (filter === "normal") return entries.filter((entry) => entry.demandLevel === "normal");
    return entries;
}

export function parseOptionalCoordinates(
    latRaw: string | null,
    lonRaw: string | null
): { lat: number; lon: number } | null {
    if (!latRaw && !lonRaw) return null;
    if (!latRaw || !lonRaw) return null;

    const lat = Number(latRaw);
    const lon = Number(lonRaw);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;

    return { lat, lon };
}

export function findStationBySlug(slug: string): StationWithDemand | null {
    return getStationBySlug(slug) ?? null;
}
