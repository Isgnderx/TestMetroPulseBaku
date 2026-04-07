import Link from "next/link";
import { ArrowLeft, Cloud } from "lucide-react";
import { notFound } from "next/navigation";
import { DemandTrendCard } from "@/components/station/DemandTrendCard";
import { ForecastCard } from "@/components/station/ForecastCard";
import { TimingAndExits } from "@/components/station/TimingAndExits";
import { Alert } from "@/components/ui/Alert";
import { fetchApi } from "@/lib/api/fetcher";
import { getServerApiUrl } from "@/lib/api/server-url";
import {
    StationBestExitsContract,
    StationBestTimeContract,
    StationDetailContract,
    StationForecastContract,
    StationHistoryContract,
    WeatherCurrentContract,
} from "@/types/contracts";
import { IntradayProfileType } from "@/types";

interface StationPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: StationPageProps) {
    const { slug } = await params;
    const detailUrl = await getServerApiUrl(`/api/stations/${slug}`);
    const detailResult = await fetchApi<StationDetailContract>(detailUrl, {
        next: { revalidate: 300 },
    });
    const stationName = detailResult.data?.station.name;

    return {
        title: stationName ? `${stationName} - Station Demand Outlook` : "Station not found",
        description:
            "Station-entry demand forecast, baseline comparison, rush window, and best exits.",
    };
}

function prettyProfileType(profileType: IntradayProfileType): string {
    if (profileType === "commuter-heavy") return "Commuter-heavy profile";
    if (profileType === "transfer-heavy") return "Transfer-heavy profile";
    if (profileType === "mixed-use") return "Mixed-use profile";
    if (profileType === "residential") return "Residential profile";
    return "Central profile";
}

export default async function StationDetailPage({ params }: StationPageProps) {
    const { slug } = await params;
    const [
        detailResult,
        historyResult,
        forecastResult,
        bestTimeResult,
        exitsResult,
        weatherResult,
    ] = await Promise.all([
        fetchApi<StationDetailContract>(await getServerApiUrl(`/api/stations/${slug}`), {
            next: { revalidate: 300 },
        }),
        fetchApi<StationHistoryContract>(await getServerApiUrl(`/api/stations/${slug}/history`), {
            next: { revalidate: 300 },
        }),
        fetchApi<StationForecastContract>(await getServerApiUrl(`/api/stations/${slug}/forecast`), {
            next: { revalidate: 300 },
        }),
        fetchApi<StationBestTimeContract>(await getServerApiUrl(`/api/stations/${slug}/best-time`), {
            next: { revalidate: 300 },
        }),
        fetchApi<StationBestExitsContract>(await getServerApiUrl(`/api/stations/${slug}/best-exits`), {
            next: { revalidate: 300 },
        }),
        fetchApi<WeatherCurrentContract>(await getServerApiUrl("/api/weather/current"), {
            next: { revalidate: 300 },
        }),
    ]);

    if (detailResult.status === 404) {
        notFound();
    }

    if (!detailResult.data) {
        return (
            <div className="min-h-screen bg-surface-900">
                <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
                    <Alert variant="error" title="Station details unavailable">
                        {detailResult.error ?? "Could not load station detail right now."}
                    </Alert>
                    <Link
                        href="/map"
                        className="inline-flex min-h-11 w-fit items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back to map
                    </Link>
                </div>
            </div>
        );
    }

    const stationDetail = detailResult.data;
    const trend = historyResult.data?.history ?? [];
    const weekForecast = forecastResult.data?.forecast ?? [];
    const forecastExplanation = forecastResult.data?.explanation;
    const todayForecast = weekForecast[0];
    const dailyTotal = todayForecast?.predictedEntries ?? stationDetail.latestForecastEntries;
    const bestTime = bestTimeResult.data;
    const exitsData: StationBestExitsContract =
        exitsResult.data ?? {
            station: {
                id: stationDetail.station.id,
                slug: stationDetail.station.slug,
                name: stationDetail.station.name,
            },
            scoringMode: "straight-line-distance",
            recommendations: {
                closestExit: null,
                balancedExit: null,
                leastCrowdedExit: null,
            },
            exits: [],
            methodologyNote: "Exit recommendations are currently unavailable.",
        };
    const hourly = bestTime?.estimatedHourly ?? [];

    const estimatedCrowdWindowLabel = bestTime?.estimatedCrowdWindowLabel ?? "No estimate available";
    const likelyQuieterPeriodLabel = bestTime?.likelyQuieterPeriodLabel ?? "No estimate available";
    const bestTimeToEnterLabel = bestTime?.bestTimeToEnterLabel ?? "No recommendation available";
    const methodologyNote =
        bestTime?.methodologyNote ??
        "Modeled from daily station demand patterns. No official observed hourly station counts are used.";
    const profileTypeLabel = bestTime
        ? prettyProfileType(bestTime.profileType)
        : "Modeled station profile";

    return (
        <div className="min-h-screen bg-surface-900">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                <div>
                    <Link
                        href="/map"
                        className="inline-flex min-h-11 items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back to map
                    </Link>
                    <h1 className="mt-3 text-2xl font-semibold text-foreground sm:text-3xl">
                        {stationDetail.station.name}
                    </h1>
                    <p className="text-sm text-muted-foreground">{stationDetail.station.nameAz}</p>
                </div>

                {(historyResult.error || forecastResult.error || bestTimeResult.error || exitsResult.error) && (
                    <Alert variant="warning" title="Some station widgets are partially unavailable">
                        {historyResult.error ?? forecastResult.error ?? bestTimeResult.error ?? exitsResult.error}
                    </Alert>
                )}

                <ForecastCard
                    station={stationDetail.station}
                    baselineEntries={stationDetail.baselineEntries}
                    confidenceLevel={todayForecast?.confidenceLevel}
                    weatherEffectScore={todayForecast?.weatherEffectScore}
                    explanation={forecastExplanation}
                />

                <DemandTrendCard
                    trend={trend}
                    hourly={hourly}
                    dailyTotal={dailyTotal}
                />

                <TimingAndExits
                    estimatedCrowdWindowLabel={estimatedCrowdWindowLabel}
                    likelyQuieterPeriodLabel={likelyQuieterPeriodLabel}
                    bestTimeToEnterLabel={bestTimeToEnterLabel}
                    methodologyNote={methodologyNote}
                    profileTypeLabel={profileTypeLabel}
                    stationSlug={stationDetail.station.slug}
                    bestExitsData={exitsData}
                />

                <section className="rounded-2xl border border-white/10 bg-surface-800/80 p-5 sm:p-6">
                    <div className="mb-2 flex items-center gap-2">
                        <Cloud className="h-4 w-4 text-metro-blue" />
                        <h2 className="text-lg font-semibold text-foreground">Weather Impact Snapshot</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {weatherResult.data?.demandInsight ?? "Live weather insight is currently unavailable."}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                        Weather signals inform demand forecasts but do not change the core product scope: station-demand intelligence, not journey tracing.
                    </p>
                </section>
            </div>
        </div>
    );
}
