import Link from "next/link";
import { MapPinned } from "lucide-react";

export function MapPreviewCta() {
    return (
        <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-surface-800/70 p-6 sm:p-8">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-metro-blue/15 blur-3xl" />
            <div className="relative max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
                    <MapPinned className="h-3.5 w-3.5 text-metro-blue" />
                    Interactive station map
                </div>
                <h2 className="mt-3 text-xl font-semibold text-foreground sm:text-2xl">
                    Compare station demand directly on the map.
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Marker color and size reflect forecast pressure, and each station panel
                    gives a quick operational snapshot for rider-facing decisions.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                    Focus: station-entry demand intelligence from open data, not origin-destination reconstruction.
                </p>
                <Link
                    href="/map"
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-metro-red px-4 py-2 text-sm font-medium text-white transition hover:bg-metro-red/90"
                >
                    Open map dashboard
                </Link>
            </div>
        </section>
    );
}
