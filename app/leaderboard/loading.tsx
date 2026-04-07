import { Skeleton } from "@/components/ui/Skeleton";

export default function LeaderboardLoading() {
    return (
        <div className="min-h-screen bg-surface-900">
            <div className="mx-auto max-w-4xl space-y-3 px-4 py-10 sm:px-6 lg:px-8" aria-busy="true" aria-live="polite">
                <p className="text-xs text-muted-foreground">Loading station-demand leaderboard...</p>
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-full max-w-2xl" />
                <div className="mt-4 space-y-2">
                    {Array.from({ length: 8 }).map((_, index) => (
                        <Skeleton key={index} className="h-16 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        </div>
    );
}
