"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Crosshair, Filter, Search } from "lucide-react";
import { DemandLevel, StationWithDemand } from "@/types";
import { MetroMap } from "@/components/map/MetroMap";
import { DemandBadge, LineBadge } from "@/components/ui/Badge";
import { formatNumber, formatDelta } from "@/lib/utils";
import { Alert } from "@/components/ui/Alert";
import { fetchApi } from "@/lib/api/fetcher";
import { StationsListContract } from "@/types/contracts";
import { ChartSkeleton } from "@/components/ui/Skeleton";

type FilterValue = "all" | DemandLevel;

const FILTERS: Array<{ value: FilterValue; label: string }> = [
    { value: "all", label: "All" },
    { value: "low", label: "Low" },
    { value: "normal", label: "Normal" },
    { value: "high", label: "High" },
    { value: "surge", label: "Surge" },
];

export default function MapPage() {
    const [selectedStation, setSelectedStation] = useState<StationWithDemand | null>(null);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<FilterValue>("all");
    const [stations, setStations] = useState<StationWithDemand[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function loadStations() {
            setIsLoading(true);
            const result = await fetchApi<StationsListContract>("/api/stations", {
                cache: "no-store",
            });

            if (!isMounted) return;

            if (result.data?.stations) {
                setStations(result.data.stations);
                setError(null);
            } else {
                setStations([]);
                setError(result.error ?? "Failed to load station demand feed.");
            }

            setIsLoading(false);
        }

        loadStations();
        return () => {
            isMounted = false;
        };
    }, []);

    const filteredStations = useMemo(() => {
        const query = search.trim().toLowerCase();
        return stations.filter((station) => {
            const nameMatch =
                station.name.toLowerCase().includes(query) ||
                station.nameAz.toLowerCase().includes(query);
            const levelMatch = filter === "all" || station.demandLevel === filter;
            return nameMatch && levelMatch;
        });
    }, [stations, search, filter]);

    useEffect(() => {
        if (!selectedStation) return;
        const stillExists = stations.some((station) => station.id === selectedStation.id);
        if (!stillExists) {
            setSelectedStation(null);
        }
    }, [selectedStation, stations]);

    return (
        <div className="min-h-screen bg-surface-900">
            <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8">
                <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-surface-800/80">
                    <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
                        <div>
                            <h1 className="text-lg font-semibold text-foreground sm:text-xl">Station Demand Map</h1>
                            <p className="text-xs text-muted-foreground sm:text-sm">
                                Marker size and color represent forecast station-entry pressure.
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <label className="relative w-full sm:max-w-xs">
                                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search station"
                                    aria-label="Search stations"
                                    className="h-11 w-full rounded-lg border border-white/15 bg-surface-900/70 pl-8 pr-3 text-sm text-foreground outline-none transition focus:border-metro-blue/60"
                                />
                            </label>
                            <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-white/15 bg-surface-900/70 p-1">
                                <Filter className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
                                {FILTERS.map((item) => (
                                    <button
                                        key={item.value}
                                        onClick={() => setFilter(item.value)}
                                        aria-pressed={filter === item.value}
                                        aria-label={`Filter stations by ${item.label}`}
                                        className={`rounded-md px-2 py-1 text-xs transition ${filter === item.value
                                                ? "bg-metro-blue/30 text-foreground"
                                                : "text-muted-foreground hover:text-foreground"
                                            }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="p-4 sm:p-5">
                            <ChartSkeleton height={520} />
                        </div>
                    ) : filteredStations.length === 0 ? (
                        <div className="flex min-h-[420px] items-center justify-center p-6 text-center">
                            <div>
                                <h2 className="text-sm font-semibold text-foreground">No stations match this filter</h2>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Try clearing search or switching demand level filters.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <MetroMap
                            stations={filteredStations}
                            selectedStationId={selectedStation?.id}
                            onStationClick={(station) => setSelectedStation(station)}
                        />
                    )}
                </section>

                <aside className="rounded-2xl border border-white/10 bg-surface-800/80 p-4 sm:p-5">
                    {error && (
                        <Alert variant="warning" title="Live data unavailable" className="mb-4">
                            {error}
                        </Alert>
                    )}
                    {!selectedStation ? (
                        <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
                            <Crosshair className="mb-3 h-7 w-7 text-metro-blue" />
                            <h2 className="text-sm font-semibold text-foreground">Select a station</h2>
                            <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
                                Click any marker to open a station panel and jump to detailed demand insights.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">{selectedStation.name}</h2>
                                <p className="text-xs text-muted-foreground">{selectedStation.nameAz}</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <LineBadge line={selectedStation.line} />
                                <DemandBadge
                                    level={selectedStation.demandLevel}
                                    label={selectedStation.demandLabel}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <PanelStat
                                    label="Forecast"
                                    value={formatNumber(selectedStation.forecastEntries ?? 0)}
                                />
                                <PanelStat label="Vs baseline" value={formatDelta(selectedStation.demandDelta)} />
                            </div>

                            <Link
                                href={`/station/${selectedStation.slug}`}
                                className="inline-flex w-full items-center justify-center rounded-lg bg-metro-red px-3 py-2 text-sm font-medium text-white transition hover:bg-metro-red/90"
                            >
                                Open station detail
                            </Link>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}

function PanelStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-white/10 bg-surface-900/60 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
        </div>
    );
}
