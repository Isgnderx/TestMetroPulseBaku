import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  DemandLevel,
  EstimatedHourlyDemand,
  IntradayProfile,
  StationForecast,
  ForecastWithContext,
  getDemandLevel,
  getDemandLabel,
} from "@/types";

const LINE_COLOR_MAP = {
  red: "#E63946",
  green: "#2DC653",
  purple: "#7B5EA7",
} as const;

const LINE_BG_CLASS_MAP = {
  red: "bg-metro-red/20 text-metro-red border-metro-red/30",
  green: "bg-metro-green/20 text-metro-green border-metro-green/30",
  purple: "bg-metro-purple/20 text-metro-purple border-metro-purple/30",
} as const;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function formatDelta(delta: number): string {
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${delta.toFixed(0)}%`;
}

export function demandColor(level: DemandLevel): string {
  const map: Record<DemandLevel, string> = {
    low: "#2DC653",
    normal: "#2196F3",
    high: "#F4A261",
    surge: "#E63946",
  };
  return map[level];
}

export function demandBgClass(level: DemandLevel): string {
  const map: Record<DemandLevel, string> = {
    low: "bg-demand-low/20 text-demand-low border-demand-low/30",
    normal: "bg-demand-normal/20 text-demand-normal border-demand-normal/30",
    high: "bg-demand-high/20 text-demand-high border-demand-high/30",
    surge: "bg-demand-surge/20 text-demand-surge border-demand-surge/30",
  };
  return map[level];
}

export function lineColor(line: "red" | "green" | "purple"): string {
  return LINE_COLOR_MAP[line];
}

export function lineBgClass(line: "red" | "green" | "purple"): string {
  return LINE_BG_CLASS_MAP[line];
}

/**
 * Derive estimated intraday demand by multiplying daily forecast
 * by the station's profile share distribution.
 * Result is an ESTIMATE — not observed hourly data.
 */
export function computeIntradayEstimates(
  dailyForecast: number,
  profile: IntradayProfile,
  isWeekend: boolean
): EstimatedHourlyDemand[] {
  const pattern = isWeekend
    ? profile.weekendPattern
    : profile.weekdayPattern;

  const rushHours = new Set([7, 8, 9, 17, 18, 19]);

  return pattern.map(({ hour, share }) => {
    const isRush = rushHours.has(hour);
    return {
      hour,
      estimatedEntries: Math.round(dailyForecast * share),
      isRush,
      label: isRush ? "Rush window" : "Off-peak",
    };
  });
}

export function computeBestTimeWindow(estimates: EstimatedHourlyDemand[]) {
  if (!estimates.length) return null;
  const sorted = [...estimates].sort(
    (a, b) => a.estimatedEntries - b.estimatedEntries
  );
  const quietest = sorted[0];
  const busiest = sorted[sorted.length - 1];

  return {
    // TimeWindow fields
    rushStart: busiest.hour,
    rushEnd: Math.min(busiest.hour + 2, 23),
    quietStart: quietest.hour,
    quietEnd: Math.min(quietest.hour + 2, 23),
    bestTimeToEnter: quietest.hour,
    label: `Best time to enter: around ${formatHour(quietest.hour)}`,
    // Extra helpers used in UI
    bestHour: quietest.hour,
    rushHour: busiest.hour,
    rushLabel: `Expected rush around ${formatHour(busiest.hour)}`,
  };
}

export function formatHour(hour: number): string {
  const period = hour < 12 ? "AM" : "PM";
  const h = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h}:00 ${period}`;
}

export function enrichForecast(fc: StationForecast): ForecastWithContext {
  const deltaPercent =
    fc.baselineEntries > 0
      ? ((fc.predictedEntries - fc.baselineEntries) / fc.baselineEntries) * 100
      : 0;
  return {
    ...fc,
    demandLevel: getDemandLevel(deltaPercent),
    demandLabel: getDemandLabel(deltaPercent),
    deltaPercent,
  };
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function isToday(isoDate: string): boolean {
  const today = new Date().toISOString().split("T")[0];
  return isoDate === today;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[əÉ™]/g, "e")
    .replace(/[öÖ]/g, "o")
    .replace(/[üÜ]/g, "u")
    .replace(/[ıI]/g, "i")
    .replace(/[ğĞ]/g, "g")
    .replace(/[çÇ]/g, "c")
    .replace(/[şŞ]/g, "s")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}
