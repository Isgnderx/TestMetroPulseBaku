import Link from "next/link";
import { MapPinned, Radar, TrendingUp } from "lucide-react";

export function HeroSection() {
    return (
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-surface-700 via-surface-800 to-surface-900 p-6 sm:p-10">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-metro-blue/15 blur-3xl" />
            <div className="absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-metro-red/10 blur-3xl" />

            <div className="relative max-w-3xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-metro-green/30 bg-metro-green/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-metro-green">
                    <Radar className="h-3.5 w-3.5" />
                    Station Demand Intelligence
                </div>

                <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-5xl">
                    Forecast station entry demand across Baku Metro with confidence.
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                    MetroPulse Baku focuses on station-entry analytics, helping riders and
                    operators understand which stations are expected to be busier, when
                    rush windows are likely, and where entry conditions are calmer.
                </p>

                <p className="mt-3 max-w-2xl text-xs leading-relaxed text-muted-foreground">
                    Built from official open station-entry data with weather-informed forecasting. This product does not trace passenger journeys or perform origin-destination reconstruction.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Link
                        href="/map"
                        className="inline-flex items-center gap-2 rounded-xl bg-metro-blue px-4 py-2 text-sm font-medium text-white transition hover:bg-metro-blue/90"
                    >
                        <MapPinned className="h-4 w-4" />
                        Open Map View
                    </Link>
                    <Link
                        href="/station/28-may"
                        className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white/10"
                    >
                        <TrendingUp className="h-4 w-4" />
                        Inspect 28 May Station
                    </Link>
                </div>
            </div>
        </section>
    );
}
