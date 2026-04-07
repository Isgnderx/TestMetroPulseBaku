import { CloudSun, Wind } from "lucide-react";
import { WeatherSummary } from "@/types";

interface WeatherInsightPreviewProps {
    summary: WeatherSummary;
}

export function WeatherInsightPreview({ summary }: WeatherInsightPreviewProps) {
    return (
        <section className="rounded-2xl border border-white/10 bg-surface-800/70 p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
                <CloudSun className="h-4 w-4 text-metro-teal" />
                <h2 className="text-lg font-semibold text-foreground">Weather Insight</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric label="Condition" value={summary.current.condition.replace("_", " ")} />
                <Metric label="Temperature" value={`${summary.current.tempC} C`} />
                <Metric label="Humidity" value={`${summary.current.humidity}%`} />
                <Metric label="Wind" value={`${summary.current.windSpeed} km/h`} />
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-surface-900/60 p-4 text-sm text-muted-foreground">
                <div className="mb-1 flex items-center gap-2 text-foreground">
                    <Wind className="h-4 w-4 text-metro-amber" />
                    Weather effect on station demand
                </div>
                <p>{summary.riderFacingNote}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                    Weather is one input in station-demand forecasting and does not imply journey-path tracking.
                </p>
            </div>
        </section>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-white/10 bg-surface-900/50 px-3 py-2.5">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 text-sm font-medium capitalize text-foreground">{value}</p>
        </div>
    );
}
