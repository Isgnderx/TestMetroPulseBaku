"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import type { TooltipProps } from "recharts";
import { formatNumber, formatHour } from "@/lib/utils";
import { StationDailyDemand, EstimatedHourlyDemand } from "@/types";
import { formatDate } from "@/lib/utils";

const CHART_COLORS = {
  area: "#2196F3",
  grid: "rgba(255,255,255,0.05)",
  axis: "rgba(255,255,255,0.3)",
};

type TooltipValue = string | number;
type TooltipName = string;

function DemandTooltip({
  active,
  payload,
  label,
}: TooltipProps<TooltipValue, TooltipName>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-surface-700 px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-foreground mb-1">{label ?? ""}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color ?? CHART_COLORS.area }}>
          {String(p.name ?? "Value")}: {formatNumber(Number(p.value ?? 0))}
        </p>
      ))}
    </div>
  );
}

function useCompactCharts(): boolean {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const apply = () => setIsCompact(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  return isCompact;
}

export function DailyTrendChart({ data }: { data: StationDailyDemand[] }) {
  const isCompact = useCompactCharts();
  const chartData = data.map((d) => ({
    date: formatDate(d.date),
    entries: d.entries,
  }));

  return (
    <ResponsiveContainer width="100%" height={isCompact ? 210 : 180}>
      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="demandGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.area} stopOpacity={0.3} />
            <stop offset="95%" stopColor={CHART_COLORS.area} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
        <XAxis
          dataKey="date"
          tick={{ fill: CHART_COLORS.axis, fontSize: isCompact ? 11 : 10 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={isCompact ? 24 : 12}
        />
        <YAxis
          tick={{ fill: CHART_COLORS.axis, fontSize: isCompact ? 11 : 10 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<DemandTooltip />} />
        <Area
          type="monotone"
          dataKey="entries"
          name="Entries"
          stroke={CHART_COLORS.area}
          strokeWidth={2}
          fill="url(#demandGrad)"
          dot={false}
          isAnimationActive={!isCompact}
          activeDot={{ r: 4, fill: CHART_COLORS.area }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function IntradayProfileChart({
  data,
}: {
  data: EstimatedHourlyDemand[];
  dailyTotal: number;
}) {
  const isCompact = useCompactCharts();
  const chartData = data.map((d) => ({
    hour: formatHour(d.hour),
    entries: d.estimatedEntries,
    isRush: d.isRush,
  }));

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-3 italic">
        Estimated intraday demand profile · modeled from daily totals and station
        patterns · not observed hourly counts
      </p>
      <ResponsiveContainer width="100%" height={isCompact ? 190 : 160}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={CHART_COLORS.grid}
            vertical={false}
          />
          <XAxis
            dataKey="hour"
            tick={{ fill: CHART_COLORS.axis, fontSize: isCompact ? 10 : 9 }}
            tickLine={false}
            axisLine={false}
            interval={isCompact ? 1 : 0}
          />
          <YAxis
            tick={{ fill: CHART_COLORS.axis, fontSize: isCompact ? 11 : 10 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<DemandTooltip />} />
          <Bar dataKey="entries" name="Est. entries" radius={[3, 3, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.isRush ? "#E63946" : "#2196F3"}
                fillOpacity={entry.isRush ? 0.9 : 0.6}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WeekForecastChart({
  data,
}: {
  data: Array<{
    date: string;
    predicted: number;
    lower: number;
    upper: number;
  }>;
}) {
  const isCompact = useCompactCharts();

  return (
    <ResponsiveContainer width="100%" height={isCompact ? 190 : 160}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#7B5EA7" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#7B5EA7" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
        <XAxis
          dataKey="date"
          tick={{ fill: CHART_COLORS.axis, fontSize: isCompact ? 11 : 10 }}
          tickLine={false}
          axisLine={false}
          minTickGap={isCompact ? 20 : 8}
        />
        <YAxis
          tick={{ fill: CHART_COLORS.axis, fontSize: isCompact ? 11 : 10 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<DemandTooltip />} />
        <Area
          type="monotone"
          dataKey="upper"
          name="Upper bound"
          stroke="none"
          fill="#7B5EA7"
          fillOpacity={0.1}
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="lower"
          name="Lower bound"
          stroke="none"
          fill={CHART_COLORS.area}
          fillOpacity={0}
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="predicted"
          name="Forecast"
          stroke="#7B5EA7"
          strokeWidth={2}
          fill="url(#forecastGrad)"
          isAnimationActive={!isCompact}
          dot={{ r: 3, fill: "#7B5EA7" }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
