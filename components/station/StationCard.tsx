import Link from "next/link";
import { cn, formatNumber, demandColor, formatDelta } from "@/lib/utils";
import { StationWithDemand } from "@/types";
import { DemandBadge, LineBadge } from "@/components/ui/Badge";
import { TrendingUp, TrendingDown, Minus, ChevronRight } from "lucide-react";

interface StationCardProps {
  station: StationWithDemand;
  rank?: number;
  className?: string;
  compact?: boolean;
}

export function StationCard({ station, rank, className, compact }: StationCardProps) {
  const DeltaIcon =
    station.demandDelta > 5
      ? TrendingUp
      : station.demandDelta < -5
        ? TrendingDown
        : Minus;

  const deltaColor =
    station.demandDelta > 5
      ? "#E63946"
      : station.demandDelta < -5
        ? "#2DC653"
        : "#2196F3";

  return (
    <Link href={`/station/${station.slug}`}>
      <div
        className={cn(
          "group rounded-xl border border-white/5 bg-surface-800 p-4 hover:border-white/10 hover:bg-surface-700 transition-all duration-200 cursor-pointer",
          className
        )}
      >
        <div className="flex items-center gap-3">
          {/* Rank */}
          {rank !== undefined && (
            <div className="flex-shrink-0 w-6 text-center">
              <span className="text-xs font-bold text-muted-foreground tabular-nums">
                {rank}
              </span>
            </div>
          )}

          {/* Demand dot */}
          <div className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-lg bg-surface-600 border border-white/5">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: demandColor(station.demandLevel) }}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-foreground truncate">{station.name}</p>
              <LineBadge line={station.line} />
            </div>
            {!compact && (
              <div className="mt-1 flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {formatNumber(station.forecastEntries ?? 0)} forecast entries
                </span>
                <span
                  className="flex items-center gap-0.5 text-xs font-medium"
                  style={{ color: deltaColor }}
                >
                  <DeltaIcon className="h-3 w-3" />
                  {formatDelta(station.demandDelta)}
                </span>
              </div>
            )}
            {compact && (
              <div className="mt-1 flex items-center gap-2 text-[11px]">
                <span className="text-muted-foreground tabular-nums">
                  {formatNumber(station.forecastEntries ?? 0)} forecast
                </span>
                <span className="text-white/20">·</span>
                <span className="font-medium" style={{ color: deltaColor }}>
                  {formatDelta(station.demandDelta)}
                </span>
              </div>
            )}
          </div>

          {/* Demand badge + arrow */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <DemandBadge level={station.demandLevel} label={station.demandLabel} />
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  );
}
