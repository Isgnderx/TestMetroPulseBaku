import Link from "next/link";
import { CloudSun, Info, Thermometer, Wind, Droplets, Zap } from "lucide-react";
import { Metadata } from "next";
import { fetchApi } from "@/lib/api/fetcher";
import { getServerApiUrl } from "@/lib/api/server-url";
import { WeatherCurrentContract } from "@/types/contracts";
import { Alert } from "@/components/ui/Alert";

export const metadata: Metadata = {
    title: "Insights – Weather & Demand",
};

export default async function InsightsPage() {
    const weatherUrl = await getServerApiUrl("/api/weather/current");
    const weatherResult = await fetchApi<WeatherCurrentContract>(weatherUrl, {
        next: { revalidate: 300 },
    });

    const weather = weatherResult.data?.weather;
    const note = weatherResult.data?.demandInsight;

    return (
        <div className="min-h-screen bg-surface-900">
            <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-5 w-5 text-metro-amber" />
                        <h1 className="text-2xl font-bold text-foreground">
                            Weather &amp; Demand Insights
                        </h1>
                    </div>
                    <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                        Live Baku weather feed with demand impact summary for metro station-entry forecasting.
                    </p>
                </div>

                {weatherResult.error && (
                    <Alert variant="warning" title="Live weather feed unavailable">
                        {weatherResult.error}
                    </Alert>
                )}

                <section className="weather-card-enter relative overflow-hidden rounded-2xl border border-white/10 bg-surface-800/70 p-5 sm:p-6">
                    <div className="weather-orb pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-metro-blue/20 blur-3xl" />
                    <div className="weather-orb weather-orb-delay pointer-events-none absolute -left-12 -bottom-16 h-40 w-40 rounded-full bg-metro-amber/20 blur-3xl" />
                    <div className="pointer-events-none absolute right-3 top-3 z-0 flex items-center gap-2 opacity-80 sm:right-4 sm:top-4">
                        <CloudSun className="weather-float-a h-4 w-4 text-metro-teal/80" />
                        <Wind className="weather-float-b h-3.5 w-3.5 text-sky-300/75" />
                        <Droplets className="weather-float-c h-3.5 w-3.5 text-metro-blue/80" />
                    </div>

                    <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <div className="min-w-0">
                            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
                                <CloudSun className="weather-float-a h-3.5 w-3.5 text-metro-teal" />
                                Live weather now
                            </div>
                            <h2 className="text-xl font-semibold text-foreground">
                                {weather ? `${weather.tempC}°C` : "Weather unavailable"}
                            </h2>
                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground break-words [overflow-wrap:anywhere]">
                                {weather
                                    ? `Feels like ${weather.feelsLikeC}°C · ${weather.condition.replace(/_/g, " ")}`
                                    : "Could not load current weather observation."}
                            </p>
                        </div>
                        <div className="shrink-0 self-start rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-muted-foreground">
                            Source: {weatherResult.meta?.source ?? "mock"}
                        </div>
                    </div>

                    <div className="relative mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <WeatherMetric icon={Thermometer} label="Temp" value={weather ? `${weather.tempC}°C` : "--"} />
                        <WeatherMetric icon={Droplets} label="Humidity" value={weather ? `${weather.humidity}%` : "--"} />
                        <WeatherMetric icon={Wind} label="Wind" value={weather ? `${weather.windSpeed} km/h` : "--"} />
                        <WeatherMetric icon={CloudSun} label="Precip." value={weather ? `${weather.precipitation} mm` : "--"} />
                    </div>

                    <div className="relative mt-4 rounded-xl border border-white/10 bg-surface-900/60 p-4 text-sm text-muted-foreground">
                        <div className="mb-1 font-medium text-foreground">Demand impact note</div>
                        <p className="leading-relaxed break-words [overflow-wrap:anywhere]">
                            {note ?? "Weather-based demand explanation is not available right now."}
                        </p>
                    </div>
                </section>

                <section className="rounded-xl border border-white/5 bg-surface-800 p-5 sm:p-6">
                    <div className="flex gap-3">
                        <Info className="h-4 w-4 text-metro-blue flex-shrink-0 mt-0.5" />
                        <div>
                            <h2 className="text-sm font-semibold text-foreground mb-2">
                                Methodology scope
                            </h2>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Weather affects station-demand estimates as an external signal.
                                Product scope stays the same: station-demand intelligence only,
                                not journey-path tracing or OD reconstruction.
                            </p>
                            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-3">
                                <Link
                                    href="/leaderboard"
                                    className="inline-flex min-h-11 items-center justify-center rounded-lg bg-metro-blue/20 px-3 py-2 text-xs font-medium text-metro-blue transition-colors hover:bg-metro-blue/30"
                                >
                                    Open leaderboard
                                </Link>
                                <Link
                                    href="/about-data"
                                    className="inline-flex min-h-11 items-center justify-center rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-white/15"
                                >
                                    Methodology notes
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

function WeatherMetric({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-xl border border-white/10 bg-surface-900/50 px-3 py-2.5 weather-metric-enter">
            <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                <Icon className="h-3.5 w-3.5" />
                <p className="truncate text-[11px] uppercase tracking-wide">{label}</p>
            </div>
            <p className="mt-1 text-sm font-medium text-foreground break-words [overflow-wrap:anywhere]">{value}</p>
        </div>
    );
}
