import Link from "next/link";
import { formatNumber, formatDelta, demandColor } from "@/lib/utils";
import { DemandBadge, LineBadge } from "@/components/ui/Badge";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import { Metadata } from "next";
import { getDemoTimeoutMs, isDemoSafeMode, withTimeout } from "@/lib/demoSafe";
import { fetchApi } from "@/lib/api/fetcher";
import { getServerApiUrl } from "@/lib/api/server-url";
import { LeaderboardContract } from "@/types/contracts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Station Leaderboard – Today's Demand Ranking",
};

type LeaderboardFetchResult = {
  data: LeaderboardContract["leaderboard"];
  status: "live" | "fallback-unavailable";
  note?: string;
  freshnessLabel?: string;
};

function emptyLeaderboardData(): LeaderboardContract["leaderboard"] {
  return {
    date: new Date().toISOString().slice(0, 10),
    entries: [],
    filter: "all",
  };
}

function isForecastUnavailable(
  entry: LeaderboardContract["leaderboard"]["entries"][number]
) {
  return entry.todayForecast <= 0 && entry.baseline <= 0;
}

async function fetchLeaderboardData(): Promise<LeaderboardFetchResult> {
  try {
    const timeoutMs = getDemoTimeoutMs(7000);
    const url = await getServerApiUrl("/api/leaderboard");

    const result = await withTimeout(
      () =>
        fetchApi<LeaderboardContract>(url, {
          cache: "no-store",
        }),
      timeoutMs,
      "Leaderboard fetch timeout"
    );

    if (!result.data || result.error) {
      return {
        data: emptyLeaderboardData(),
        status: "fallback-unavailable",
        note: result.error ?? "Live leaderboard data is temporarily unavailable.",
      };
    }

    return {
      data: result.data.leaderboard,
      status: "live",
      freshnessLabel: result.meta?.generatedAt,
    };
  } catch {
    return {
      data: emptyLeaderboardData(),
      status: "fallback-unavailable",
      note: "Could not load live leaderboard right now.",
    };
  }
}

export default async function LeaderboardPage() {
  const demoSafeMode = isDemoSafeMode();
  const { data, status, note, freshnessLabel } = await fetchLeaderboardData();
  const entries = data.entries;

  const surge = entries.filter(e => !isForecastUnavailable(e) && e.demandLevel === "surge").length;
  const high = entries.filter(e => !isForecastUnavailable(e) && e.demandLevel === "high").length;
  const normal = entries.filter(e => !isForecastUnavailable(e) && e.demandLevel === "normal").length;
  const low = entries.filter(e => !isForecastUnavailable(e) && e.demandLevel === "low").length;
  const unavailable = entries.filter(isForecastUnavailable).length;

  return (
    <div className="min-h-screen bg-surface-900">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-5 w-5 text-metro-red" />
            <h1 className="text-2xl font-bold text-foreground">
              Station Demand Leaderboard
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Latest station-demand snapshot from official metro open data.
            Data reflects station-entry intelligence — not full journey data.
          </p>
          <div className="mt-2 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-muted-foreground">
            Forecast-based ranking · station entries
          </div>
          {demoSafeMode && (
            <p className="mt-1 text-xs text-metro-blue">Demo-safe mode enabled</p>
          )}
          {freshnessLabel && (
            <p className="mt-1 text-xs text-muted-foreground">{freshnessLabel}</p>
          )}
          {status !== "live" && (
            <p className="mt-2 text-xs text-demand-high">
              {note ?? "Live leaderboard data is temporarily unavailable."}
            </p>
          )}
          {unavailable > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {unavailable} station forecast{unavailable === 1 ? "" : "s"} unavailable because
              source data is still missing.
            </p>
          )}
        </div>

        {/* Summary chips */}
        <div className="flex flex-wrap gap-2">
          <SummaryChip color="#E63946" label="Surge" count={surge} />
          <SummaryChip color="#F4A261" label="Busier than usual" count={high} />
          <SummaryChip color="#2196F3" label="Normal" count={normal} />
          <SummaryChip color="#2DC653" label="Quieter than usual" count={low} />
        </div>

        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[40px_1fr_120px_100px_100px_120px] gap-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-white/5 pb-2">
          <span>#</span>
          <span>Station</span>
          <span className="text-right">Forecast</span>
          <span className="text-right">Baseline</span>
          <span className="text-right">Delta</span>
          <span className="text-right">Status</span>
        </div>

        {/* Rows */}
        <div className="space-y-2.5">
          {entries.map(entry => {
            const forecastUnavailable = isForecastUnavailable(entry);

            return (
            <Link key={entry.station.id} href={`/station/${entry.station.slug}`}>
              <div className="group grid cursor-pointer grid-cols-1 items-center gap-2 rounded-xl border border-white/5 bg-surface-800 px-4 py-3.5 transition-all hover:border-white/10 hover:bg-surface-700 sm:grid-cols-[40px_1fr_120px_100px_100px_120px] sm:gap-4">
                {/* Rank */}
                <div className="hidden sm:flex items-center">
                  <RankDisplay rank={entry.rank} />
                </div>

                {/* Station info */}
                <div className="flex items-center gap-3">
                  <div className="sm:hidden">
                    <RankDisplay rank={entry.rank} />
                  </div>
                  <div
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: forecastUnavailable ? "#64748b" : demandColor(entry.demandLevel) }}
                  />
                  <div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-foreground">
                      {entry.station.name}
                    </p>
                    <LineBadge line={entry.station.line} />
                  </div>
                </div>

                {/* Forecast */}
                <div className="sm:text-right">
                  <span className="text-sm font-bold text-foreground tabular-nums">
                    {forecastUnavailable ? "N/A" : formatNumber(entry.todayForecast)}
                  </span>
                  <p className="text-[10px] text-muted-foreground sm:hidden">forecast entries</p>
                  <div className="mt-1 flex items-center gap-2 sm:hidden">
                    {forecastUnavailable ? (
                      <span className="text-[10px] text-muted-foreground">Forecast unavailable</span>
                    ) : (
                      <>
                        <span
                          className="text-[11px] font-semibold tabular-nums"
                          style={{ color: demandColor(entry.demandLevel) }}
                        >
                          {formatDelta(entry.deltaPercent)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{entry.demandLabel}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Baseline */}
                <div className="hidden sm:block text-right">
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {forecastUnavailable ? "N/A" : formatNumber(entry.baseline)}
                  </span>
                </div>

                <div className="mt-1 grid grid-cols-2 gap-2 text-[10px] sm:hidden">
                  <div className="rounded-md border border-white/10 bg-surface-900/50 px-2 py-1.5">
                    <p className="text-muted-foreground">Baseline</p>
                    <p className="mt-0.5 text-xs font-semibold text-foreground tabular-nums">
                      {forecastUnavailable ? "N/A" : formatNumber(entry.baseline)}
                    </p>
                  </div>
                  <div className="rounded-md border border-white/10 bg-surface-900/50 px-2 py-1.5">
                    <p className="text-muted-foreground">Status</p>
                    <p className="mt-0.5 text-xs font-semibold text-foreground">
                      {forecastUnavailable ? "Forecast unavailable" : entry.demandLabel}
                    </p>
                  </div>
                </div>

                {/* Delta */}
                <div className="hidden sm:flex items-center justify-end gap-1">
                  {forecastUnavailable ? (
                    <span className="text-sm font-semibold text-muted-foreground">N/A</span>
                  ) : (
                    <>
                      <DeltaIcon delta={entry.deltaPercent} />
                      <span
                        className="text-sm font-semibold tabular-nums"
                        style={{ color: demandColor(entry.demandLevel) }}
                      >
                        {formatDelta(entry.deltaPercent)}
                      </span>
                    </>
                  )}
                </div>

                {/* Status */}
                <div className="sm:flex items-center justify-end hidden">
                  {forecastUnavailable ? (
                    <span className="text-xs text-muted-foreground">Forecast unavailable</span>
                  ) : (
                    <DemandBadge level={entry.demandLevel} label={entry.demandLabel} />
                  )}
                </div>
              </div>
            </Link>
            );
          })}
          {entries.length === 0 && (
            <div className="rounded-xl border border-white/5 bg-surface-800 px-4 py-6 text-center">
              <p className="text-sm text-foreground font-medium">
                Leaderboard temporarily unavailable
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Live ranking is temporarily unavailable. Please retry shortly.
              </p>
              <div className="mt-3">
                <Link
                  href="/map"
                  className="inline-flex items-center rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-white/15 transition-colors"
                >
                  Open live map
                </Link>
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center pt-4 border-t border-white/5">
          Station entries are demand forecasts based on official Baku Metro data.
          This leaderboard reflects station-entry intelligence, not passenger journey counts.{" "}
          <Link href="/about-data" className="text-metro-blue underline underline-offset-2">
            About the data
          </Link>
        </p>
      </div>
    </div>
  );
}

function RankDisplay({ rank }: { rank: number }) {
  const color =
    rank === 1 ? "#F4A261" : rank === 2 ? "#94a3b8" : rank === 3 ? "#cd7f32" : undefined;
  return (
    <span
      className="text-sm font-bold tabular-nums w-6 text-center"
      style={{ color: color ?? "#475569" }}
    >
      {rank}
    </span>
  );
}

function DeltaIcon({ delta }: { delta: number }) {
  if (delta > 5) return <TrendingUp className="h-3.5 w-3.5 text-demand-surge" />;
  if (delta < -5) return <TrendingDown className="h-3.5 w-3.5 text-demand-low" />;
  return <Minus className="h-3.5 w-3.5 text-demand-normal" />;
}

function SummaryChip({
  color,
  label,
  count,
}: {
  color: string;
  label: string;
  count: number;
}) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border"
      style={{
        backgroundColor: color + "22",
        color,
        borderColor: color + "44",
      }}
    >
      <span className="font-bold">{count}</span>
      <span>{label}</span>
    </div>
  );
}
