import { Clock3, DoorOpen } from "lucide-react";
import { StationBestExitsContract } from "@/types/contracts";
import { ExitRecommendations } from "@/components/station/ExitRecommendations";

interface TimingAndExitsProps {
    estimatedCrowdWindowLabel: string;
    likelyQuieterPeriodLabel: string;
    bestTimeToEnterLabel: string;
    methodologyNote: string;
    profileTypeLabel: string;
    stationSlug: string;
    bestExitsData: StationBestExitsContract;
}

export function TimingAndExits({
    estimatedCrowdWindowLabel,
    likelyQuieterPeriodLabel,
    bestTimeToEnterLabel,
    methodologyNote,
    profileTypeLabel,
    stationSlug,
    bestExitsData,
}: TimingAndExitsProps) {
    return (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <section className="rounded-2xl border border-white/10 bg-surface-800/80 p-4 sm:p-6">
                <div className="mb-4 flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-metro-amber" />
                    <h2 className="text-lg font-semibold text-foreground">Entry Timing</h2>
                </div>
                <p className="mb-3 inline-flex rounded-full border border-white/10 bg-surface-900/50 px-2.5 py-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                    {profileTypeLabel}
                </p>
                <div className="space-y-3">
                    <Item label="Estimated crowd window" value={estimatedCrowdWindowLabel} />
                    <Item label="Likely quieter period" value={likelyQuieterPeriodLabel} />
                    <Item label="Best time to enter" value={bestTimeToEnterLabel} />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{methodologyNote}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                    These timing windows are model estimates from daily station totals, not observed per-hour turnstile counts.
                </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-surface-800/80 p-4 sm:p-6">
                <div className="mb-4 flex items-center gap-2">
                    <DoorOpen className="h-4 w-4 text-metro-teal" />
                    <h2 className="text-lg font-semibold text-foreground">Best Exits</h2>
                </div>
                <ExitRecommendations stationSlug={stationSlug} initialData={bestExitsData} />
                <p className="mt-3 text-xs text-muted-foreground">
                    Exit suggestions are proximity-based station guidance and do not reconstruct full passenger journeys.
                </p>
            </section>
        </div>
    );
}

function Item({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-white/10 bg-surface-900/60 px-3 py-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 text-sm font-semibold leading-relaxed text-foreground">{value}</p>
        </div>
    );
}
