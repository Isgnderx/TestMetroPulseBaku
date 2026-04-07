import { createServiceClient } from "@/lib/supabase";
import { enrichForecast } from "@/lib/utils";
import { buildIntradayEstimate, getProfileTypeFromStationType } from "@/lib/server/intraday-estimation";
import { rankStationExits } from "@/lib/server/exit-recommendation";
import { generateStationForecastExplanation } from "@/lib/server/explanations/service";
import {
    ForecastWithContext,
    getDemandLabel,
    getDemandLevel,
    LeaderboardFilter,
    LeaderboardResponse,
    MetroLine,
    ScoredExit,
    StationType,
    StationWithDemand,
    WeatherCondition,
} from "@/types";
import {
    LeaderboardContract,
    StationBestExitsContract,
    StationBestTimeContract,
    StationDetailContract,
    StationForecastContract,
    StationHistoryContract,
    StationsListContract,
    WeatherCurrentContract,
} from "@/types/contracts";

type StationRow = {
    id: string;
    slug: string;
    name: string;
    name_az: string | null;
    line: string;
    lat: number;
    lon: number;
    station_type: string | null;
    opened_year: number | null;
    created_at: string;
    updated_at: string;
};

type ForecastRow = {
    id: string;
    station_id: string;
    forecast_date: string;
    predicted_entries: number;
    lower_bound: number | null;
    upper_bound: number | null;
    model_name: string;
    model_version: string;
    confidence_level: number | null;
    weather_effect_score: number | null;
    baseline_entries: number | null;
    rider_facing_note: string | null;
    created_at: string;
    updated_at: string;
};

type DemandRow = {
    date: string;
    station_id: string;
    entries: number;
    source_year: number;
    created_at: string;
};

type ExitRow = {
    id: string;
    station_id: string;
    exit_no: number;
    exit_label: string;
    address_text: string | null;
    lat: number;
    lon: number;
    is_accessible: boolean | null;
    notes: string | null;
};

type IntradayProfileRow = {
    station_id: string;
    profile_type: "commuter-heavy" | "transfer-heavy" | "residential" | "mixed-use" | "central";
    weekday_pattern_json: Array<{ hour: number; share: number }>;
    weekend_pattern_json: Array<{ hour: number; share: number }>;
    confidence_note: string | null;
};

type WeatherRow = {
    observed_at: string;
    temp_c: number | null;
    feels_like_c: number | null;
    humidity: number | null;
    wind_speed: number | null;
    precipitation: number | null;
    pressure: number | null;
    condition: string | null;
};

const VALID_LINES: MetroLine[] = ["red", "green", "purple"];
const VALID_STATION_TYPES: StationType[] = [
    "commuter",
    "transfer",
    "residential",
    "mixed",
    "central",
    "tourist",
    "business",
];
const VALID_WEATHER_CONDITIONS: WeatherCondition[] = [
    "clear",
    "partly_cloudy",
    "cloudy",
    "rain",
    "heavy_rain",
    "fog",
    "snow",
    "wind",
    "storm",
];

function coerceLine(value: string): MetroLine {
    return VALID_LINES.includes(value as MetroLine) ? (value as MetroLine) : "red";
}

function coerceStationType(value: string | null): StationType {
    return VALID_STATION_TYPES.includes(value as StationType) ? (value as StationType) : "mixed";
}

function coerceWeatherCondition(value: string | null): WeatherCondition {
    return VALID_WEATHER_CONDITIONS.includes(value as WeatherCondition)
        ? (value as WeatherCondition)
        : "cloudy";
}

function mapStation(row: StationRow): Omit<StationWithDemand, "demandLevel" | "demandDelta" | "demandLabel"> {
    return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        nameAz: row.name_az ?? row.name,
        line: coerceLine(row.line),
        lat: row.lat,
        lon: row.lon,
        stationType: coerceStationType(row.station_type),
        openedYear: row.opened_year ?? undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        forecastEntries: undefined,
        todayEntries: undefined,
    };
}

function mapDemandStation(station: StationRow, forecast?: ForecastRow): StationWithDemand {
    const base = mapStation(station);
    const forecastEntries = forecast?.predicted_entries ?? 0;
    const baseline = forecast?.baseline_entries ?? forecastEntries;
    const deltaPercent = baseline > 0 ? ((forecastEntries - baseline) / baseline) * 100 : 0;

    return {
        ...base,
        forecastEntries,
        demandDelta: deltaPercent,
        demandLevel: getDemandLevel(deltaPercent),
        demandLabel: getDemandLabel(deltaPercent),
    };
}

function mapForecastWithContext(row: ForecastRow): ForecastWithContext {
    return enrichForecast({
        id: row.id,
        stationId: row.station_id,
        forecastDate: row.forecast_date,
        predictedEntries: row.predicted_entries,
        lowerBound: row.lower_bound ?? row.predicted_entries,
        upperBound: row.upper_bound ?? row.predicted_entries,
        modelName: row.model_name,
        modelVersion: row.model_version,
        confidenceLevel: row.confidence_level ?? 0.7,
        weatherEffectScore: row.weather_effect_score ?? 0,
        baselineEntries: row.baseline_entries ?? row.predicted_entries,
        riderFacingNote: row.rider_facing_note ?? "Forecast based on station-level trends.",
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    });
}

async function getStationBySlug(slug: string): Promise<StationRow | null> {
    const client = createServiceClient();
    const { data, error } = await client
        .from("stations")
        .select("id,slug,name,name_az,line,lat,lon,station_type,opened_year,created_at,updated_at")
        .eq("slug", slug)
        .maybeSingle<StationRow>();

    if (error) throw new Error(error.message);
    return data ?? null;
}

async function getLatestForecastDate(): Promise<string | null> {
    const client = createServiceClient();
    const { data, error } = await client
        .from("station_forecasts")
        .select("forecast_date")
        .order("forecast_date", { ascending: false })
        .limit(1);

    if (error) throw new Error(error.message);
    return data?.[0]?.forecast_date ?? null;
}

async function getForecastsByDate(forecastDate: string): Promise<ForecastRow[]> {
    const client = createServiceClient();
    const { data, error } = await client
        .from("station_forecasts")
        .select(
            "id,station_id,forecast_date,predicted_entries,lower_bound,upper_bound,model_name,model_version,confidence_level,weather_effect_score,baseline_entries,rider_facing_note,created_at,updated_at"
        )
        .eq("forecast_date", forecastDate)
        .returns<ForecastRow[]>();

    if (error) throw new Error(error.message);
    return data ?? [];
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

function getDemandInsight(weather: WeatherCurrentContract["weather"]): string {
    if (weather.precipitation >= 3 || weather.condition === "heavy_rain") {
        return "Rain conditions may increase station crowding around covered entrances.";
    }
    if (weather.windSpeed >= 30) {
        return "Strong winds usually shift riders toward shorter transfer paths and closer exits.";
    }
    if (weather.tempC >= 32) {
        return "High temperatures can move demand slightly later in the day as riders avoid peak heat.";
    }
    return "Weather impact is mild; station demand should mostly follow regular weekday patterns.";
}

function toScoredExits(
    stationId: string,
    exits: ExitRow[],
    destination?: { lat: number; lon: number }
): ReturnType<typeof rankStationExits> {
    return rankStationExits({
        destination,
        exits: exits.map((exit) => ({
            id: exit.id,
            stationId,
            exitNo: exit.exit_no,
            exitLabel: exit.exit_label,
            addressText: exit.address_text ?? "Address unavailable",
            lat: exit.lat,
            lon: exit.lon,
            isAccessible: exit.is_accessible ?? false,
            notes: exit.notes ?? undefined,
        })),
    });
}

export async function getStationsPayload(): Promise<StationsListContract> {
    const client = createServiceClient();

    const { data: stations, error } = await client
        .from("stations")
        .select("id,slug,name,name_az,line,lat,lon,station_type,opened_year,created_at,updated_at")
        .returns<StationRow[]>();

    if (error) throw new Error(error.message);

    const forecastDate = await getLatestForecastDate();
    const forecasts = forecastDate ? await getForecastsByDate(forecastDate) : [];
    const forecastByStation = new Map(forecasts.map((item) => [item.station_id, item]));

    const enriched = (stations ?? [])
        .map((station) => mapDemandStation(station, forecastByStation.get(station.id)))
        .sort((a, b) => (b.forecastEntries ?? 0) - (a.forecastEntries ?? 0));

    return { stations: enriched };
}

export async function getStationDetailPayload(
    slug: string
): Promise<StationDetailContract | null> {
    const station = await getStationBySlug(slug);
    if (!station) return null;

    const client = createServiceClient();
    const { data: latestForecast, error } = await client
        .from("station_forecasts")
        .select(
            "id,station_id,forecast_date,predicted_entries,lower_bound,upper_bound,model_name,model_version,confidence_level,weather_effect_score,baseline_entries,rider_facing_note,created_at,updated_at"
        )
        .eq("station_id", station.id)
        .order("forecast_date", { ascending: false })
        .limit(1)
        .maybeSingle<ForecastRow>();

    if (error) throw new Error(error.message);

    const enrichedStation = mapDemandStation(station, latestForecast ?? undefined);
    const baselineEntries = latestForecast?.baseline_entries ?? latestForecast?.predicted_entries ?? 0;

    return {
        station: enrichedStation,
        baselineEntries,
        latestForecastEntries: latestForecast?.predicted_entries ?? 0,
        latestDeltaPercent: enrichedStation.demandDelta,
        latestDemandLabel: enrichedStation.demandLabel,
    };
}

export async function getStationHistoryPayload(
    slug: string
): Promise<StationHistoryContract | null> {
    const station = await getStationBySlug(slug);
    if (!station) return null;

    const client = createServiceClient();
    const { data, error } = await client
        .from("station_daily_demand")
        .select("date,station_id,entries,source_year,created_at")
        .eq("station_id", station.id)
        .order("date", { ascending: false })
        .limit(21)
        .returns<DemandRow[]>();

    if (error) throw new Error(error.message);

    const history = (data ?? [])
        .slice()
        .reverse()
        .map((item) => ({
            date: item.date,
            stationId: item.station_id,
            entries: item.entries,
            sourceYear: item.source_year,
            createdAt: item.created_at,
        }));

    return {
        station: {
            id: station.id,
            slug: station.slug,
            name: station.name,
        },
        history,
    };
}

export async function getStationForecastPayload(
    slug: string
): Promise<StationForecastContract | null> {
    const station = await getStationBySlug(slug);
    if (!station) return null;

    const today = new Date().toISOString().slice(0, 10);
    const client = createServiceClient();
    const { data, error } = await client
        .from("station_forecasts")
        .select(
            "id,station_id,forecast_date,predicted_entries,lower_bound,upper_bound,model_name,model_version,confidence_level,weather_effect_score,baseline_entries,rider_facing_note,created_at,updated_at"
        )
        .eq("station_id", station.id)
        .gte("forecast_date", today)
        .order("forecast_date", { ascending: true })
        .limit(7)
        .returns<ForecastRow[]>();

    if (error) throw new Error(error.message);

    const forecast = (data ?? []).map(mapForecastWithContext);

    const primaryForecast = forecast[0];
    const bestTime = await getStationBestTimePayload(slug);

    const { data: latestWeather } = await client
        .from("weather_city_center")
        .select("condition")
        .order("observed_at", { ascending: false })
        .limit(1)
        .maybeSingle<{ condition: string | null }>();

    const explanation = primaryForecast
        ? await generateStationForecastExplanation({
            stationName: station.name,
            predictedEntries: primaryForecast.predictedEntries,
            baselineEntries: primaryForecast.baselineEntries,
            deltaPercent: primaryForecast.deltaPercent,
            confidenceLevel: primaryForecast.confidenceLevel,
            weatherEffectScore: primaryForecast.weatherEffectScore,
            weatherCondition: latestWeather?.condition ?? "cloudy",
            rushWindowLabel: bestTime?.estimatedCrowdWindowLabel ?? "typical rush window",
        })
        : {
            summary: "Forecast explanation is currently unavailable.",
            weatherSummary: "Weather impact summary is currently unavailable.",
            source: "template" as const,
        };

    return {
        station: {
            id: station.id,
            slug: station.slug,
            name: station.name,
        },
        forecast,
        explanation,
    };
}

export async function getStationBestTimePayload(
    slug: string
): Promise<StationBestTimeContract | null> {
    const station = await getStationBySlug(slug);
    if (!station) return null;

    const client = createServiceClient();

    const { data: profile, error: profileError } = await client
        .from("station_intraday_profiles")
        .select("station_id,profile_type,weekday_pattern_json,weekend_pattern_json,confidence_note")
        .eq("station_id", station.id)
        .maybeSingle<IntradayProfileRow>();

    if (profileError) throw new Error(profileError.message);

    const { data: latestForecast, error: forecastError } = await client
        .from("station_forecasts")
        .select(
            "id,station_id,forecast_date,predicted_entries,lower_bound,upper_bound,model_name,model_version,confidence_level,weather_effect_score,baseline_entries,rider_facing_note,created_at,updated_at"
        )
        .eq("station_id", station.id)
        .order("forecast_date", { ascending: false })
        .limit(1)
        .maybeSingle<ForecastRow>();

    if (forecastError) throw new Error(forecastError.message);
    if (!latestForecast) return null;

    const isWeekend = [0, 6].includes(new Date(latestForecast.forecast_date).getDay());

    const stationProfileType = getProfileTypeFromStationType(
        (station.station_type as StationType | null) ?? null
    );

    const profileType = profile?.profile_type ?? stationProfileType;
    const customShares = isWeekend ? profile?.weekend_pattern_json : profile?.weekday_pattern_json;

    const intraday = buildIntradayEstimate({
        dailyForecastEntries: latestForecast.predicted_entries,
        profileType,
        isWeekend,
        customShares,
    });

    return {
        station: {
            id: station.id,
            slug: station.slug,
            name: station.name,
        },
        profileType: intraday.profileType,
        operatingHours: intraday.operatingHours,
        estimatedHourly: intraday.estimatedHourly,
        bestTimeToEnterHour: intraday.bestTimeToEnterHour,
        rushWindow: {
            startHour: intraday.rushWindow.startHour,
            endHour: intraday.rushWindow.endHour,
        },
        quietWindow: {
            startHour: intraday.quietWindow.startHour,
            endHour: intraday.quietWindow.endHour,
        },
        estimatedCrowdWindowLabel: intraday.rushWindow.label,
        likelyQuieterPeriodLabel: intraday.quietWindow.label,
        bestTimeToEnterLabel: intraday.bestTimeToEnterLabel,
        methodologyNote: intraday.methodologyNote,
    };
}

export async function getStationBestExitsPayload(
    slug: string,
    destination?: { lat: number; lon: number }
): Promise<StationBestExitsContract | null> {
    const station = await getStationBySlug(slug);
    if (!station) return null;

    const client = createServiceClient();
    const { data: exits, error } = await client
        .from("station_exits")
        .select("id,station_id,exit_no,exit_label,address_text,lat,lon,is_accessible,notes")
        .eq("station_id", station.id)
        .order("exit_no", { ascending: true })
        .returns<ExitRow[]>();

    if (error) throw new Error(error.message);

    const recommendation = toScoredExits(station.id, exits ?? [], destination);

    return {
        station: {
            id: station.id,
            slug: station.slug,
            name: station.name,
        },
        destination,
        scoringMode: recommendation.scoringMode,
        recommendations: {
            closestExit: recommendation.closestExit,
            balancedExit: recommendation.balancedExit,
            leastCrowdedExit: recommendation.leastCrowdedExit,
        },
        exits: recommendation.sortedExits,
        methodologyNote: recommendation.methodologyNote,
    };
}

export async function getLeaderboardPayload(
    filter: LeaderboardFilter = "all"
): Promise<LeaderboardContract> {
    const stationsPayload = await getStationsPayload();

    const entries = stationsPayload.stations
        .map((station) => {
            const baseline = Math.round((station.forecastEntries ?? 0) / (1 + station.demandDelta / 100));
            return {
                rank: 0,
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
                demandLevel: station.demandLevel,
                demandLabel: station.demandLabel,
            };
        })
        .sort((a, b) => b.todayForecast - a.todayForecast)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

    const filtered = applyLeaderboardFilter(entries, filter);

    return {
        leaderboard: {
            date: new Date().toISOString().slice(0, 10),
            entries: filtered,
            filter,
        },
        filter,
    };
}

export async function getCurrentWeatherPayload(): Promise<WeatherCurrentContract> {
    const client = createServiceClient();
    const { data, error } = await client
        .from("weather_city_center")
        .select("observed_at,temp_c,feels_like_c,humidity,wind_speed,precipitation,pressure,condition")
        .order("observed_at", { ascending: false })
        .limit(1)
        .maybeSingle<WeatherRow>();

    if (error) throw new Error(error.message);

    const weather = {
        observedAt: data?.observed_at ?? new Date().toISOString(),
        tempC: Math.round(data?.temp_c ?? 0),
        feelsLikeC: Math.round(data?.feels_like_c ?? data?.temp_c ?? 0),
        humidity: Math.round(data?.humidity ?? 0),
        windSpeed: Math.round(data?.wind_speed ?? 0),
        precipitation: Number((data?.precipitation ?? 0).toFixed(1)),
        pressure: Math.round(data?.pressure ?? 0),
        condition: coerceWeatherCondition(data?.condition ?? null),
        createdAt: new Date().toISOString(),
    };

    return {
        weather,
        demandInsight: getDemandInsight(weather),
    };
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
