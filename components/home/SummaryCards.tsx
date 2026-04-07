import { Activity, ArrowUpRight, Building2, Users } from "lucide-react";
import { StationWithDemand } from "@/types";
import { formatNumber } from "@/lib/utils";
import { StatCard } from "@/components/ui/Card";

interface SummaryCardsProps {
    stations: StationWithDemand[];
}

export function SummaryCards({ stations }: SummaryCardsProps) {
    const totalForecastEntries = stations.reduce(
        (sum, station) => sum + (station.forecastEntries ?? 0),
        0
    );

    const busiestStation = stations[0];
    const surgeCount = stations.filter((station) => station.demandLevel === "surge").length;
    const highOrSurgeCount = stations.filter(
        (station) => station.demandLevel === "high" || station.demandLevel === "surge"
    ).length;

    return (
        <section>
            <div className="mb-3 rounded-xl border border-white/10 bg-surface-800/65 px-3 py-2 text-xs text-muted-foreground">
                Snapshot from official station-entry open data and weather-informed forecasting.
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Today Forecast Entries"
                    value={formatNumber(totalForecastEntries)}
                    sub="Across modeled stations"
                    icon={Users}
                    accentColor="#2196F3"
                />
                <StatCard
                    label="Busiest Station"
                    value={busiestStation?.name ?? "N/A"}
                    sub={
                        busiestStation?.forecastEntries
                            ? `${formatNumber(busiestStation.forecastEntries)} expected entries`
                            : "No data"
                    }
                    icon={Building2}
                    accentColor="#E63946"
                />
                <StatCard
                    label="Surge Alerts"
                    value={surgeCount}
                    sub="Stations far above baseline"
                    icon={ArrowUpRight}
                    accentColor="#F4A261"
                />
                <StatCard
                    label="High Pressure Nodes"
                    value={highOrSurgeCount}
                    sub="High or surge demand level"
                    icon={Activity}
                    accentColor="#26C6DA"
                />
            </div>
        </section>
    );
}
