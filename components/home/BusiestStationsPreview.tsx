import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StationWithDemand } from "@/types";
import { StationCard } from "@/components/station/StationCard";

interface BusiestStationsPreviewProps {
    stations: StationWithDemand[];
}

export function BusiestStationsPreview({ stations }: BusiestStationsPreviewProps) {
    return (
        <section className="rounded-2xl border border-white/10 bg-surface-800/70 p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Busiest Stations Today</h2>
                    <p className="text-sm text-muted-foreground">
                        Forecast preview of station-entry pressure by location.
                    </p>
                </div>
                <Link
                    href="/map"
                    className="inline-flex items-center gap-1 text-sm font-medium text-metro-blue transition hover:text-metro-blue/80"
                >
                    Open live map
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </div>

            <div className="space-y-3">
                {stations.map((station, index) => (
                    <StationCard key={station.id} station={station} rank={index + 1} compact />
                ))}
            </div>
        </section>
    );
}
