"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn, lineColor, demandColor } from "@/lib/utils";
import { StationWithDemand } from "@/types";
import { fetchApi } from "@/lib/api/fetcher";
import { StationsListContract } from "@/types/contracts";

export function StationSearch({ className }: { className?: string }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [stations, setStations] = useState<StationWithDemand[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results: StationWithDemand[] = query.length >= 1
    ? stations.filter((s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.nameAz.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 6)
    : [];

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadStations() {
      setIsLoading(true);
      const result = await fetchApi<StationsListContract>("/api/stations", {
        cache: "force-cache",
      });

      if (!isMounted) return;

      if (result.data?.stations) {
        setStations(result.data.stations);
        setLoadError(null);
      } else {
        setStations([]);
        setLoadError(result.error ?? "Could not load stations");
      }

      setIsLoading(false);
    }

    loadStations();
    return () => {
      isMounted = false;
    };
  }, []);

  function handleSelect(station: StationWithDemand) {
    setQuery("");
    setOpen(false);
    router.push(`/station/${station.slug}`);
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search stations…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="w-full rounded-xl bg-surface-700 border border-white/10 pl-9 pr-8 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-metro-blue/50 transition-colors min-h-11"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); inputRef.current?.focus(); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full mt-1.5 left-0 right-0 z-50 max-h-80 overflow-y-auto rounded-xl border border-white/10 bg-surface-700 shadow-2xl">
          {results.map((station) => (
            <button
              key={station.id}
              onClick={() => handleSelect(station)}
              className="w-full flex min-h-11 items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
            >
              <div
                className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: demandColor(station.demandLevel) }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{station.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{station.stationType} · {station.line} line</p>
              </div>
              <div
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: lineColor(station.line) + "22",
                  color: lineColor(station.line),
                }}
              >
                {station.line}
              </div>
            </button>
          ))}
        </div>
      )}

      {open && query.length >= 2 && results.length === 0 && (
        <div className="absolute top-full mt-1.5 left-0 right-0 z-50 rounded-xl border border-white/10 bg-surface-700 shadow-2xl px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Loading stations..."
              : loadError
                ? "Search is temporarily unavailable"
                : `No stations found for "${query}"`}
          </p>
        </div>
      )}
    </div>
  );
}
