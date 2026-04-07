import { DailyTrendChart, IntradayProfileChart } from "@/components/charts/DemandChartsClient";
import { EstimatedHourlyDemand, StationDailyDemand } from "@/types";

interface DemandTrendCardProps {
    trend: StationDailyDemand[];
    hourly: EstimatedHourlyDemand[];
    dailyTotal: number;
}

export function DemandTrendCard({ trend, hourly, dailyTotal }: DemandTrendCardProps) {
    const hasTrend = trend.length > 0;
    const hasHourly = hourly.length > 0;

    return (
        <section className="space-y-4 rounded-2xl border border-white/10 bg-surface-800/80 p-4 sm:p-6">
            <div>
                <h2 className="text-lg font-semibold text-foreground">Demand Trend</h2>
                <p className="text-sm text-muted-foreground">
                    Recent station-entry pattern and modeled intraday profile
                </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-surface-900/55 p-3 sm:p-4">
                <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Last 14 days</p>
                {hasTrend ? (
                    <DailyTrendChart data={trend} />
                ) : (
                    <div className="rounded-lg border border-white/10 bg-surface-900/60 px-3 py-6 text-center text-xs text-muted-foreground">
                        Recent history is not available for this station yet.
                    </div>
                )}
            </div>

            <div className="rounded-xl border border-white/10 bg-surface-900/55 p-3 sm:p-4">
                <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Today profile</p>
                {hasHourly ? (
                    <IntradayProfileChart data={hourly} dailyTotal={dailyTotal} />
                ) : (
                    <div className="rounded-lg border border-white/10 bg-surface-900/60 px-3 py-6 text-center text-xs text-muted-foreground">
                        Intraday estimate is temporarily unavailable.
                    </div>
                )}
            </div>

            <div className="rounded-lg border border-white/10 bg-surface-900/45 px-3 py-2 text-xs text-muted-foreground">
                Daily totals come from official open station-entry data. Intraday values are modeled estimates, not observed hourly counts.
            </div>
        </section>
    );
}
