import { ChartSkeleton } from "@/components/ui/Skeleton";

export default function MapLoading() {
    return (
        <div className="min-h-screen bg-surface-900">
            <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8" aria-busy="true" aria-live="polite">
                <section className="overflow-hidden rounded-2xl border border-white/10 bg-surface-800/80 p-4 sm:p-5">
                    <p className="mb-3 text-xs text-muted-foreground">Loading map and station overlays...</p>
                    <ChartSkeleton height={520} />
                </section>
                <aside className="rounded-2xl border border-white/10 bg-surface-800/80 p-4 sm:p-5">
                    <p className="mb-3 text-xs text-muted-foreground">Loading station side panel...</p>
                    <ChartSkeleton height={260} />
                </aside>
            </div>
        </div>
    );
}
