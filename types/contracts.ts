import {
    EstimatedHourlyDemand,
    ForecastWithContext,
    IntradayProfileType,
    LeaderboardFilter,
    LeaderboardResponse,
    ScoredExit,
    StationDailyDemand,
    StationWithDemand,
    WeatherObservation,
} from "@/types";

export interface ApiMeta {
    source: "mock" | "supabase";
    generatedAt: string;
    version: "v1";
}

export interface ApiSuccess<T> {
    data: T;
    meta: ApiMeta;
}

export interface ApiError {
    error: {
        code: string;
        message: string;
    };
    meta: ApiMeta;
}

export type ApiResult<T> = ApiSuccess<T> | ApiError;

export interface StationsListContract {
    stations: StationWithDemand[];
}

export interface StationDetailContract {
    station: StationWithDemand;
    baselineEntries: number;
    latestForecastEntries: number;
    latestDeltaPercent: number;
    latestDemandLabel: string;
}

export interface StationHistoryContract {
    station: Pick<StationWithDemand, "id" | "slug" | "name">;
    history: StationDailyDemand[];
}

export interface StationForecastContract {
    station: Pick<StationWithDemand, "id" | "slug" | "name">;
    forecast: ForecastWithContext[];
    explanation: {
        summary: string;
        weatherSummary: string;
        source: "openrouter" | "template";
    };
}

export interface StationBestTimeContract {
    station: Pick<StationWithDemand, "id" | "slug" | "name">;
    profileType: IntradayProfileType;
    operatingHours: {
        startHour: number;
        endHour: number;
    };
    estimatedHourly: EstimatedHourlyDemand[];
    bestTimeToEnterHour: number;
    rushWindow: {
        startHour: number;
        endHour: number;
    };
    quietWindow: {
        startHour: number;
        endHour: number;
    };
    estimatedCrowdWindowLabel: string;
    likelyQuieterPeriodLabel: string;
    bestTimeToEnterLabel: string;
    methodologyNote: string;
}

export interface StationBestExitsContract {
    station: Pick<StationWithDemand, "id" | "slug" | "name">;
    destination?: {
        lat: number;
        lon: number;
    };
    scoringMode: "straight-line-distance";
    recommendations: {
        closestExit: ScoredExit | null;
        balancedExit: ScoredExit | null;
        leastCrowdedExit: ScoredExit | null;
    };
    exits: ScoredExit[];
    methodologyNote: string;
}

export interface LeaderboardContract {
    leaderboard: LeaderboardResponse;
    filter: LeaderboardFilter;
}

export interface WeatherCurrentContract {
    weather: WeatherObservation;
    demandInsight: string;
}
