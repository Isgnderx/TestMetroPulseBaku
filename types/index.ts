/**
 * MetroPulse Baku - Shared TypeScript Domain Types
 *
 * NOTE: The metro dataset is station-entry / validation data only.
 * It does NOT support origin-destination trip reconstruction.
 * All types and APIs reflect station-demand intelligence, not full journey data.
 */

// ─── Station ──────────────────────────────────────────────────────────────────

export type MetroLine = "red" | "green" | "purple";

export type StationType =
  | "commuter"
  | "transfer"
  | "residential"
  | "mixed"
  | "central"
  | "tourist"
  | "business";

export interface Station {
  id: string;
  slug: string;
  name: string;
  nameAz: string; // Azerbaijani name
  line: MetroLine;
  lat: number;
  lon: number;
  stationType: StationType;
  openedYear?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StationWithDemand extends Station {
  todayEntries?: number;
  forecastEntries?: number;
  confidenceLevel?: number;
  weatherEffectScore?: number;
  demandLevel: DemandLevel;
  demandDelta: number; // percent vs baseline
  demandLabel: string; // "Busier than usual" etc.
}

// ─── Demand ───────────────────────────────────────────────────────────────────

export type DemandLevel = "low" | "normal" | "high" | "surge";

export function getDemandLevel(deltaPercent: number): DemandLevel {
  if (deltaPercent <= -15) return "low";
  if (deltaPercent <= 15) return "normal";
  if (deltaPercent <= 40) return "high";
  return "surge";
}

export function getDemandLabel(deltaPercent: number): string {
  if (deltaPercent <= -25) return "Much quieter than usual";
  if (deltaPercent <= -10) return "Quieter than usual";
  if (deltaPercent <= 10) return "Normal demand";
  if (deltaPercent <= 30) return "Busier than usual";
  return "Much busier than usual";
}

// ─── Daily Demand ─────────────────────────────────────────────────────────────

export interface StationDailyDemand {
  date: string; // ISO date YYYY-MM-DD
  stationId: string;
  entries: number;
  sourceYear: number;
  createdAt: string;
}

// ─── Station Exits ────────────────────────────────────────────────────────────

export interface StationExit {
  id: string;
  stationId: string;
  exitNo: number;
  exitLabel: string;
  addressText: string;
  lat: number;
  lon: number;
  isAccessible?: boolean;
  notes?: string;
}

export interface ScoredExit extends StationExit {
  distanceMeters?: number;
  score: number;
  tag?: "closest" | "balanced" | "least-crowded";
  crowdPenalty?: number;
  closurePenalty?: number;
  accessibilityPenalty?: number;
  convenienceBoost?: number;
  scoringNote?: string;
}

// ─── Weather ──────────────────────────────────────────────────────────────────

export type WeatherCondition =
  | "clear"
  | "partly_cloudy"
  | "cloudy"
  | "rain"
  | "heavy_rain"
  | "fog"
  | "snow"
  | "wind"
  | "storm";

export interface WeatherObservation {
  observedAt: string; // ISO datetime
  tempC: number;
  feelsLikeC: number;
  humidity: number;
  windSpeed: number; // km/h
  precipitation: number; // mm
  pressure: number; // hPa
  condition: WeatherCondition;
  createdAt: string;
}

export interface WeatherSummary {
  current: WeatherObservation;
  demandEffect: "increase" | "decrease" | "neutral";
  effectMagnitude: "low" | "medium" | "high";
  riderFacingNote: string;
}

// ─── Forecasts ────────────────────────────────────────────────────────────────

export interface StationForecast {
  id: string;
  stationId: string;
  forecastDate: string; // ISO date
  predictedEntries: number;
  lowerBound: number;
  upperBound: number;
  modelName: string;
  modelVersion: string;
  confidenceLevel: number; // 0–1
  weatherEffectScore: number; // -1 to +1
  baselineEntries: number;
  riderFacingNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface ForecastWithContext extends StationForecast {
  demandLevel: DemandLevel;
  demandLabel: string;
  deltaPercent: number;
}

// ─── Intraday Profile ─────────────────────────────────────────────────────────

export type IntradayProfileType =
  | "commuter-heavy"
  | "transfer-heavy"
  | "residential"
  | "mixed-use"
  | "central";

export interface HourlyShareEntry {
  hour: number; // 0–23
  share: number; // fraction of daily total, must sum to ~1
}

export interface IntradayProfile {
  id: string;
  stationId: string;
  profileType: IntradayProfileType;
  weekdayPattern: HourlyShareEntry[];
  weekendPattern: HourlyShareEntry[];
  confidenceNote: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Estimated hourly demand derived from daily forecast × intraday profile.
 * These are ESTIMATES, not observed hourly counts.
 */
export interface EstimatedHourlyDemand {
  hour: number;
  estimatedEntries: number;
  isRush: boolean;
  label: string;
}

// ─── Station Baseline ────────────────────────────────────────────────────────

export interface StationBaseline {
  stationId: string;
  dow: number; // 0=Sunday … 6=Saturday
  avgEntries: number;
  medianEntries: number;
  rollingAvg7: number;
  rollingAvg30: number;
  updatedAt: string;
}

// ─── API Response Envelopes ──────────────────────────────────────────────────

export interface ApiSuccess<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  error: string;
  code?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── API Payloads ─────────────────────────────────────────────────────────────

export interface StationsListResponse {
  stations: StationWithDemand[];
  updatedAt: string;
}

export interface StationDetailResponse {
  station: Station;
  todayForecast: ForecastWithContext;
  weekForecast: ForecastWithContext[];
  recentHistory: StationDailyDemand[];
  intradayProfile: EstimatedHourlyDemand[];
  bestTimeWindow: TimeWindow;
  exits: ScoredExit[];
  weatherEffect: WeatherSummary;
}

export interface TimeWindow {
  rushStart: number; // hour
  rushEnd: number;
  quietStart: number;
  quietEnd: number;
  bestTimeToEnter: number; // recommended hour
  label: string;
}

export interface LeaderboardEntry {
  rank: number;
  station: Station;
  todayForecast: number;
  baseline: number;
  deltaPercent: number;
  demandLevel: DemandLevel;
  demandLabel: string;
}

export interface LeaderboardResponse {
  date: string;
  entries: LeaderboardEntry[];
  filter: LeaderboardFilter;
}

export type LeaderboardFilter =
  | "all"
  | "busier"
  | "quieter"
  | "surge"
  | "normal";

export interface BestExitsResponse {
  stationId: string;
  destination?: { lat: number; lon: number };
  exits: ScoredExit[];
  note: string;
}

export interface WeatherDemandInsightResponse {
  current: WeatherSummary;
  stationSensitivity: Array<{
    station: Pick<Station, "id" | "slug" | "name" | "line">;
    sensitivityScore: number; // 0–1
    note: string;
  }>;
  generalInsights: string[];
}
