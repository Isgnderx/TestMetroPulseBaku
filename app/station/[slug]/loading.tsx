import { ChartSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function StationLoading() {
    return (
        <div className="min-h-screen bg-surface-900">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8" aria-busy="true" aria-live="polite">
                <p className="text-xs text-muted-foreground">Loading station-demand briefing...</p>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-5 w-40" />
                <div className="rounded-2xl border border-white/10 bg-surface-800/80 p-5 sm:p-6">
                    <ChartSkeleton height={120} />
                </div>
                <div className="rounded-2xl border border-white/10 bg-surface-800/80 p-5 sm:p-6">
                    <ChartSkeleton height={280} />
                </div>
            </div>
        </div>
    );
}
