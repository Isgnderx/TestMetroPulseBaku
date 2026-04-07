import { LineChart } from "lucide-react";
import { ConfidenceBadge, DemandBadge, LineBadge } from "@/components/ui/Badge";
import { StationWithDemand } from "@/types";
import { formatDelta, formatNumber } from "@/lib/utils";

interface ForecastCardProps {
    station: StationWithDemand;
    baselineEntries: number;
    confidenceLevel?: number;
    weatherEffectScore?: number;
    explanation?: {
        summary: string;
        weatherSummary: string;
        source: "openrouter" | "template";
    };
}

export function ForecastCard({
    station,
    baselineEntries,
    confidenceLevel,
    weatherEffectScore,
    explanation,
}: ForecastCardProps) {
    const hasConfidence = typeof confidenceLevel === "number";
    const weatherTag =
        typeof weatherEffectScore === "number"
            ? weatherEffectScore > 0.1
                ? "Weather-adjusted upward"
                : weatherEffectScore < -0.1
                    ? "Weather-adjusted downward"
                    : "Weather impact near neutral"
            : null;

    return (
        <section className="rounded-2xl border border-white/10 bg-surface-800/80 p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Today Forecast</h2>
                    <p className="text-sm text-muted-foreground">
                        Station-entry projection against baseline
                    </p>
                </div>
                <LineChart className="h-5 w-5 text-metro-blue" />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Metric label="Forecast entries" value={formatNumber(station.forecastEntries ?? 0)} />
                <Metric label="Baseline" value={formatNumber(baselineEntries)} />
                <Metric label="Delta" value={formatDelta(station.demandDelta)} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
                <LineBadge line={station.line} />
                <DemandBadge level={station.demandLevel} label={station.demandLabel} />
                {hasConfidence && <ConfidenceBadge level={confidenceLevel} />}
            </div>

            <div className="mt-3 rounded-lg border border-white/10 bg-surface-900/45 px-3 py-2 text-xs text-muted-foreground">
                <p>Forecast uses official station-entry open data and weather-informed features.</p>
                {weatherTag && <p className="mt-1">{weatherTag}.</p>}
            </div>

            {explanation && (
                <div className="mt-4 space-y-2 rounded-xl border border-white/10 bg-surface-900/60 p-3 sm:p-4">
                    <p className="text-sm leading-relaxed text-foreground">{explanation.summary}</p>
                    <p className="text-xs text-muted-foreground">{explanation.weatherSummary}</p>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Explanation source: {explanation.source}
                    </p>
                </div>
            )}
        </section>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-white/10 bg-surface-900/60 px-3 py-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 text-base font-semibold text-foreground sm:text-sm">{value}</p>
        </div>
    );
}
