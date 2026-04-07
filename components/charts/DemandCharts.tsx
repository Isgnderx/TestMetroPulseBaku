"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/Skeleton";

// All Recharts-based charts must be client-only to avoid SSR issues
export const DailyTrendChart = dynamic(
  () => import("./DemandChartsClient").then((m) => m.DailyTrendChart),
  { ssr: false, loading: () => <Skeleton className="h-44 w-full" /> }
);

export const IntradayProfileChart = dynamic(
  () => import("./DemandChartsClient").then((m) => m.IntradayProfileChart),
  { ssr: false, loading: () => <Skeleton className="h-40 w-full" /> }
);

export const WeekForecastChart = dynamic(
  () => import("./DemandChartsClient").then((m) => m.WeekForecastChart),
  { ssr: false, loading: () => <Skeleton className="h-40 w-full" /> }
);
