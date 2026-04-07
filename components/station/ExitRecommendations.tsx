"use client";

import { useMemo, useState } from "react";
import { MapPin, Navigation, PersonStanding, Route } from "lucide-react";
import { fetchApi } from "@/lib/api/fetcher";
import { StationBestExitsContract } from "@/types/contracts";

interface ExitRecommendationsProps {
    stationSlug: string;
    initialData: StationBestExitsContract;
}

function formatMeters(value?: number): string {
    if (typeof value !== "number") return "N/A";
    if (value >= 1000) return `${(value / 1000).toFixed(2)} km`;
    return `${Math.round(value)} m`;
}

export function ExitRecommendations({ stationSlug, initialData }: ExitRecommendationsProps) {
    const [latInput, setLatInput] = useState("");
    const [lonInput, setLonInput] = useState("");
    const [result, setResult] = useState<StationBestExitsContract>(initialData);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const hasDestination = Boolean(result.destination);

    const destinationLabel = useMemo(() => {
        if (!result.destination) return "No destination pin selected";
        return `${result.destination.lat.toFixed(5)}, ${result.destination.lon.toFixed(5)}`;
    }, [result.destination]);

    async function applyDestination() {
        const lat = Number(latInput);
        const lon = Number(lonInput);

        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
            setError("Please enter valid latitude and longitude values.");
            return;
        }

        setIsLoading(true);
        setError(null);

        const query = new URLSearchParams({ lat: String(lat), lon: String(lon) }).toString();
        const response = await fetchApi<StationBestExitsContract>(
            `/api/stations/${stationSlug}/best-exits?${query}`,
            { cache: "no-store" }
        );

        if (!response.data) {
            setError(response.error ?? "Failed to compute exit recommendations.");
            setIsLoading(false);
            return;
        }

        setResult(response.data);
        setIsLoading(false);
    }

    async function clearDestination() {
        setIsLoading(true);
        setError(null);

        const response = await fetchApi<StationBestExitsContract>(
            `/api/stations/${stationSlug}/best-exits`,
            { cache: "no-store" }
        );

        if (!response.data) {
            setError(response.error ?? "Failed to reset destination filter.");
            setIsLoading(false);
            return;
        }

        setLatInput("");
        setLonInput("");
        setResult(response.data);
        setIsLoading(false);
    }

    const { closestExit, balancedExit, leastCrowdedExit } = result.recommendations;

    return (
        <div className="space-y-3">
            <div className="rounded-lg border border-white/10 bg-surface-900/60 p-3">
                <div className="mb-2 flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-metro-blue" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Optional Destination Pin
                    </p>
                </div>
                <p className="mb-2 text-xs text-muted-foreground">{destinationLabel}</p>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input
                        value={latInput}
                        onChange={(event) => setLatInput(event.target.value)}
                        placeholder="Latitude"
                        className="h-9 rounded-md border border-white/15 bg-surface-800/80 px-2.5 text-sm text-foreground outline-none transition focus:border-metro-blue/70"
                    />
                    <input
                        value={lonInput}
                        onChange={(event) => setLonInput(event.target.value)}
                        placeholder="Longitude"
                        className="h-9 rounded-md border border-white/15 bg-surface-800/80 px-2.5 text-sm text-foreground outline-none transition focus:border-metro-blue/70"
                    />
                </div>

                <div className="mt-2 flex gap-2">
                    <button
                        onClick={applyDestination}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1 rounded-md bg-metro-blue px-3 py-1.5 text-xs font-medium text-white transition hover:bg-metro-blue/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Navigation className="h-3.5 w-3.5" />
                        Apply pin
                    </button>
                    <button
                        onClick={clearDestination}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Reset
                    </button>
                </div>

                {error && <p className="mt-2 text-xs text-demand-high">{error}</p>}
            </div>

            <div className="grid grid-cols-1 gap-2">
                <RecommendedItem
                    title="Closest exit"
                    icon={Route}
                    exitLabel={closestExit?.exitLabel}
                    subtitle={closestExit?.addressText}
                    badge={formatMeters(closestExit?.distanceMeters)}
                />
                <RecommendedItem
                    title="Balanced exit"
                    icon={Navigation}
                    exitLabel={balancedExit?.exitLabel}
                    subtitle={balancedExit?.addressText}
                    badge={`Score ${balancedExit?.score?.toFixed(1) ?? "N/A"}`}
                />
                <RecommendedItem
                    title="Least crowded exit heuristic"
                    icon={PersonStanding}
                    exitLabel={leastCrowdedExit?.exitLabel}
                    subtitle={leastCrowdedExit?.addressText}
                    badge={`Penalty ${leastCrowdedExit?.crowdPenalty?.toFixed(2) ?? "N/A"}`}
                />
            </div>

            <div className="rounded-lg border border-white/10 bg-surface-900/55 p-3">
                <p className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                    Sorted exits ({hasDestination ? "destination-aware" : "generic convenience"})
                </p>
                <div className="space-y-2">
                    {result.exits.map((exit) => (
                        <div key={exit.id} className="rounded-md border border-white/10 bg-surface-800/70 px-3 py-2">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-medium text-foreground">{exit.exitLabel}</p>
                                <span className="text-xs text-muted-foreground">#{exit.exitNo}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{exit.addressText}</p>
                            <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                                <span>Score: {exit.score.toFixed(2)}</span>
                                {typeof exit.distanceMeters === "number" && <span>Distance: {formatMeters(exit.distanceMeters)}</span>}
                                <span>Crowd penalty: {(exit.crowdPenalty ?? 0).toFixed(2)}</span>
                                <span>Closure penalty: {(exit.closurePenalty ?? 0).toFixed(2)}</span>
                            </div>
                        </div>
                    ))}
                    {result.exits.length === 0 && (
                        <p className="text-xs text-muted-foreground">No exits available for this station.</p>
                    )}
                </div>
            </div>

            <p className="text-xs text-muted-foreground">{result.methodologyNote}</p>
        </div>
    );
}

function RecommendedItem({
    title,
    icon: Icon,
    exitLabel,
    subtitle,
    badge,
}: {
    title: string;
    icon: React.ElementType;
    exitLabel?: string;
    subtitle?: string;
    badge: string;
}) {
    return (
        <div className="rounded-lg border border-white/10 bg-surface-900/60 px-3 py-2.5">
            <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-metro-teal" />
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{title}</p>
                </div>
                <span className="text-[11px] text-muted-foreground">{badge}</span>
            </div>
            <p className="text-sm font-semibold text-foreground">{exitLabel ?? "Unavailable"}</p>
            <p className="text-xs text-muted-foreground">{subtitle ?? "No details"}</p>
        </div>
    );
}
