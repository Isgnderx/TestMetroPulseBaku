import { BusiestStationsPreview } from "@/components/home/BusiestStationsPreview";
import { HeroSection } from "@/components/home/HeroSection";
import { MapPreviewCta } from "@/components/home/MapPreviewCta";
import { SummaryCards } from "@/components/home/SummaryCards";
import { WeatherInsightPreview } from "@/components/home/WeatherInsightPreview";
import { Alert } from "@/components/ui/Alert";
import { fetchApi } from "@/lib/api/fetcher";
import { getServerApiUrl } from "@/lib/api/server-url";
import { StationsListContract, WeatherCurrentContract } from "@/types/contracts";
import { WeatherSummary } from "@/types";

export const metadata = {
    title: "MetroPulse Baku - Station Demand Intelligence",
};

function toWeatherSummary(weatherPayload: WeatherCurrentContract | null): WeatherSummary {
    if (!weatherPayload) {
        return {
            current: {
                observedAt: new Date().toISOString(),
                tempC: 0,
                feelsLikeC: 0,
                humidity: 0,
                windSpeed: 0,
                precipitation: 0,
                pressure: 0,
                condition: "cloudy",
                createdAt: new Date().toISOString(),
            },
            demandEffect: "neutral",
            effectMagnitude: "low",
            riderFacingNote: "Live weather insights are temporarily unavailable.",
        };
    }

    return {
        current: weatherPayload.weather,
        demandEffect: "neutral",
        effectMagnitude: "low",
        riderFacingNote: weatherPayload.demandInsight,
    };
}

export default async function HomePage() {
    const stationsUrl = await getServerApiUrl("/api/stations");
    const weatherUrl = await getServerApiUrl("/api/weather/current");

    const [stationsResult, weatherResult] = await Promise.all([
        fetchApi<StationsListContract>(stationsUrl, { next: { revalidate: 300 } }),
        fetchApi<WeatherCurrentContract>(weatherUrl, { next: { revalidate: 300 } }),
    ]);

    const stations = stationsResult.data?.stations ?? [];
    const topStations = stations.slice(0, 5);
    const weatherSummary = toWeatherSummary(weatherResult.data);

    return (
        <div className="relative min-h-screen bg-surface-900">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(33,150,243,0.14),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(230,57,70,0.12),transparent_36%)]" />

            <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:gap-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
                <HeroSection />

                {stationsResult.error && (
                    <Alert variant="warning" title="Live station feed unavailable">
                        {stationsResult.error}
                    </Alert>
                )}

                <SummaryCards stations={stations} />

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <div className="xl:col-span-2">
                        {topStations.length > 0 ? (
                            <BusiestStationsPreview stations={topStations} />
                        ) : (
                            <section className="rounded-2xl border border-white/10 bg-surface-800/70 p-5 sm:p-6">
                                <h2 className="text-lg font-semibold text-foreground">Busiest Stations Today</h2>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Forecast data is not available yet. Run the forecasting job to populate station-demand outlooks.
                                </p>
                            </section>
                        )}
                    </div>
                    <WeatherInsightPreview summary={weatherSummary} />
                </div>

                <p className="text-center text-xs text-muted-foreground">
                    MetroPulse Baku presents station-entry demand intelligence from official open data. It does not perform origin-destination reconstruction.
                </p>

                <MapPreviewCta />
            </div>
        </div>
    );
}
