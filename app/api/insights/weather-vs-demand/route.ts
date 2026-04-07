import { NextResponse } from "next/server";
import { getCurrentWeather } from "@/lib/weather";
import { createServiceClient } from "@/lib/supabase";

type DailyWeatherRow = {
  observed_at: string;
  precipitation: number | null;
  temp_c: number | null;
  wind_speed: number | null;
};

type DailyDemandRow = {
  date: string;
  station_id: string;
  entries: number;
};

type StationRow = {
  id: string;
  slug: string;
  name: string;
  line: "red" | "green" | "purple";
};

type DailyWeatherAggregate = {
  precipitation: number;
  tempC: number;
  windSpeed: number;
};

type NetworkDay = {
  date: string;
  entries: number;
  precipitation: number;
  tempC: number;
};

function pearsonCorrelation(x: number[], y: number[]): number | null {
  if (x.length !== y.length || x.length < 2) return null;

  const n = x.length;
  const meanX = x.reduce((sum, v) => sum + v, 0) / n;
  const meanY = y.reduce((sum, v) => sum + v, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i += 1) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  if (denX === 0 || denY === 0) return null;
  return num / Math.sqrt(denX * denY);
}

function toMagnitude(absScore: number): "none" | "low" | "medium" | "high" {
  if (absScore < 0.1) return "none";
  if (absScore < 0.2) return "low";
  if (absScore < 0.35) return "medium";
  return "high";
}

function toSensitivityScore(corr: number): number {
  return Number(Math.min(1, Math.max(0, Math.abs(corr))).toFixed(3));
}

function aggregateWeatherByDate(rows: DailyWeatherRow[]): Map<string, DailyWeatherAggregate> {
  const buckets = new Map<
    string,
    { precipSum: number; tempSum: number; windSum: number; count: number }
  >();

  for (const row of rows) {
    const date = row.observed_at.slice(0, 10);
    const prev = buckets.get(date) ?? {
      precipSum: 0,
      tempSum: 0,
      windSum: 0,
      count: 0,
    };

    prev.precipSum += row.precipitation ?? 0;
    prev.tempSum += row.temp_c ?? 0;
    prev.windSum += row.wind_speed ?? 0;
    prev.count += 1;
    buckets.set(date, prev);
  }

  const out = new Map<string, DailyWeatherAggregate>();
  for (const [date, agg] of buckets.entries()) {
    if (agg.count === 0) continue;
    out.set(date, {
      precipitation: Number(agg.precipSum.toFixed(2)),
      tempC: Number((agg.tempSum / agg.count).toFixed(2)),
      windSpeed: Number((agg.windSum / agg.count).toFixed(2)),
    });
  }

  return out;
}

function aggregateNetworkDemandByDate(rows: DailyDemandRow[]): Map<string, number> {
  const byDate = new Map<string, number>();
  for (const row of rows) {
    byDate.set(row.date, (byDate.get(row.date) ?? 0) + row.entries);
  }
  return byDate;
}

function buildNetworkJoin(
  weatherByDate: Map<string, DailyWeatherAggregate>,
  demandByDate: Map<string, number>
): NetworkDay[] {
  const joined: NetworkDay[] = [];
  for (const [date, entries] of demandByDate.entries()) {
    const weather = weatherByDate.get(date);
    if (!weather) continue;
    joined.push({
      date,
      entries,
      precipitation: weather.precipitation,
      tempC: weather.tempC,
    });
  }

  return joined.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * GET /api/insights/weather-vs-demand
 *
 * Returns weather observations correlated with demand deltas across stations.
 * Provides station-level weather sensitivity scores and network-wide summaries.
 *
 * Station data is entry counts only — not origin-destination journey data.
 */
export async function GET() {
  const nowIso = new Date().toISOString();

  try {
    const supabase = createServiceClient();

    const sinceDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 120)
      .toISOString()
      .slice(0, 10);

    const [weatherNowRes, weatherRowsRes, demandRowsRes, stationsRes] =
      await Promise.allSettled([
        getCurrentWeather(),
        supabase
          .from("weather_city_center")
          .select("observed_at, precipitation, temp_c, wind_speed")
          .gte("observed_at", `${sinceDate}T00:00:00Z`)
          .order("observed_at", { ascending: true }),
        supabase
          .from("station_daily_demand")
          .select("date, station_id, entries")
          .gte("date", sinceDate)
          .order("date", { ascending: true }),
        supabase.from("stations").select("id, slug, name, line"),
      ]);

    const currentWeather =
      weatherNowRes.status === "fulfilled" ? weatherNowRes.value : null;

    if (
      weatherRowsRes.status !== "fulfilled" ||
      demandRowsRes.status !== "fulfilled" ||
      stationsRes.status !== "fulfilled" ||
      weatherRowsRes.value.error ||
      demandRowsRes.value.error ||
      stationsRes.value.error
    ) {
      return NextResponse.json({
        data: {
          generatedAt: nowIso,
          currentWeather,
          todayEffect: {
            direction: "neutral",
            magnitude: "none",
            note:
              "Historical weather-demand joins are currently unavailable from database sources.",
          },
          networkSummary: {
            highSensitivityStations: 0,
            moderateSensitivityStations: 0,
            lowSensitivityStations: 0,
            totalStations: 0,
          },
          stationSensitivity: [],
          methodology:
            "Uses joined daily station entries and aggregated daily weather when available. Currently unavailable due to missing query inputs.",
        },
        meta: {
          source: "supabase",
          analyticsStatus: "unavailable",
        },
      });
    }

    const weatherRows = (weatherRowsRes.value.data ?? []) as DailyWeatherRow[];
    const demandRows = (demandRowsRes.value.data ?? []) as DailyDemandRow[];
    const stations = (stationsRes.value.data ?? []) as StationRow[];

    const weatherByDate = aggregateWeatherByDate(weatherRows);
    const networkDemandByDate = aggregateNetworkDemandByDate(demandRows);
    const networkJoined = buildNetworkJoin(weatherByDate, networkDemandByDate);

    const minDaysForNetwork = 14;
    const hasEnoughNetworkData = networkJoined.length >= minDaysForNetwork;

    const precipSeries = networkJoined.map((d) => d.precipitation);
    const tempSeries = networkJoined.map((d) => d.tempC);
    const entriesSeries = networkJoined.map((d) => d.entries);

    const precipCorr = hasEnoughNetworkData
      ? pearsonCorrelation(precipSeries, entriesSeries)
      : null;
    const tempCorr = hasEnoughNetworkData
      ? pearsonCorrelation(tempSeries, entriesSeries)
      : null;

    const stationById = new Map(stations.map((s) => [s.id, s]));
    const demandRowsByStation = new Map<string, DailyDemandRow[]>();
    for (const row of demandRows) {
      const arr = demandRowsByStation.get(row.station_id) ?? [];
      arr.push(row);
      demandRowsByStation.set(row.station_id, arr);
    }

    const stationSensitivity = Array.from(demandRowsByStation.entries())
      .map(([stationId, stationRows]) => {
        const station = stationById.get(stationId);
        if (!station) return null;

        const joined = stationRows
          .map((r) => {
            const weather = weatherByDate.get(r.date);
            if (!weather) return null;
            return { entries: r.entries, precipitation: weather.precipitation };
          })
          .filter(
            (v): v is { entries: number; precipitation: number } => Boolean(v)
          );

        if (joined.length < minDaysForNetwork) return null;

        const corr = pearsonCorrelation(
          joined.map((x) => x.precipitation),
          joined.map((x) => x.entries)
        );

        if (corr === null) return null;

        const score = toSensitivityScore(corr);
        const direction = corr > 0 ? "higher" : "lower";
        return {
          station: {
            id: station.id,
            slug: station.slug,
            name: station.name,
            line: station.line,
          },
          sensitivityScore: score,
          note:
            `Estimated from ${joined.length} joined station-days. ` +
            `Rainier days correlated with ${direction} entries (corr=${corr.toFixed(2)}).`,
        };
      })
      .filter(
        (
          item
        ): item is {
          station: { id: string; slug: string; name: string; line: "red" | "green" | "purple" };
          sensitivityScore: number;
          note: string;
        } => Boolean(item)
      )
      .sort((a, b) => b.sensitivityScore - a.sensitivityScore)
      .slice(0, 12);

    const highSensitivityStations = stationSensitivity.filter(
      (s) => s.sensitivityScore >= 0.35
    ).length;
    const moderateSensitivityStations = stationSensitivity.filter(
      (s) => s.sensitivityScore >= 0.2 && s.sensitivityScore < 0.35
    ).length;
    const lowSensitivityStations = stationSensitivity.filter(
      (s) => s.sensitivityScore < 0.2
    ).length;

    const effectSource =
      precipCorr !== null
        ? { type: "precipitation" as const, corr: precipCorr }
        : tempCorr !== null
          ? { type: "temperature" as const, corr: tempCorr }
          : null;

    const todayDirection = effectSource
      ? effectSource.corr > 0
        ? "increase"
        : effectSource.corr < 0
          ? "decrease"
          : "neutral"
      : "neutral";

    const todayMagnitude = effectSource
      ? toMagnitude(Math.abs(effectSource.corr))
      : "none";

    const todayNote = effectSource
      ? `Based on ${networkJoined.length} joined network-days, ${effectSource.type} vs entries correlation is ${effectSource.corr.toFixed(
        2
      )} (estimated analytics).`
      : "Insufficient joined weather-demand history to estimate a network-level weather effect yet.";

    return NextResponse.json({
      data: {
        generatedAt: nowIso,
        currentWeather,
        todayEffect: {
          direction: todayDirection,
          magnitude: todayMagnitude,
          note: todayNote,
        },
        networkSummary: {
          highSensitivityStations,
          moderateSensitivityStations,
          lowSensitivityStations,
          totalStations: stationSensitivity.length,
        },
        stationSensitivity,
        methodology:
          "Station sensitivity is estimated from real joins between station_daily_demand (daily entries) and weather_city_center aggregated to daily values. Correlation-based metrics are reported only when enough joined history exists.",
      },
      meta: {
        source: "supabase+open-meteo",
        analyticsStatus: hasEnoughNetworkData ? "estimated-from-real-data" : "unavailable",
        joinedDays: networkJoined.length,
      },
    });
  } catch {
    return NextResponse.json({
      data: {
        generatedAt: nowIso,
        currentWeather: null,
        todayEffect: {
          direction: "neutral",
          magnitude: "none",
          note:
            "Weather-demand analytics are currently unavailable.",
        },
        networkSummary: {
          highSensitivityStations: 0,
          moderateSensitivityStations: 0,
          lowSensitivityStations: 0,
          totalStations: 0,
        },
        stationSensitivity: [],
        methodology:
          "This endpoint returns real joined analytics when available; currently unavailable due to runtime error.",
      },
      meta: {
        source: "supabase+open-meteo",
        analyticsStatus: "unavailable",
      },
    });
  }
}
