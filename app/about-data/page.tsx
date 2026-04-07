import Link from "next/link";
import { Shield, Database, RefreshCw, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About the Data – Methodology & Transparency",
};

export default function AboutDataPage() {
  return (
    <div className="min-h-screen bg-surface-900">
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-6 sm:space-y-10 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-metro-blue" />
            <h1 className="text-2xl font-bold text-foreground">
              About the Data
            </h1>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            MetroPulse Baku is committed to transparency about what our data
            shows, what it can infer, and what it cannot claim. This page
            explains our official open data sources, station-demand methodology,
            and product limits clearly.
          </p>
        </div>

        <div className="rounded-xl border border-metro-blue/30 bg-metro-blue/10 p-4 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">Simple methodology in one line</p>
          <p className="mt-1">
            Official daily station-entry totals + weather features + temporal patterns = station-demand forecast with confidence bounds.
          </p>
        </div>

        {/* Primary constraint banner */}
        <div className="rounded-xl border border-metro-amber/30 bg-metro-amber/10 p-5">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-metro-amber flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-foreground mb-2">
                Important: Station-Entry Data Only
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The Baku Metro dataset used by this product contains{" "}
                <strong className="text-foreground">
                  station-entry / validation counts
                </strong>{" "}
                only. It records how many passengers entered a station on a
                given day.
              </p>
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                <FactRow ok={false} text="Does NOT include where passengers traveled to" />
                <FactRow ok={false} text="Does NOT support origin-destination trip reconstruction" />
                <FactRow ok={false} text="Does NOT reveal individual passenger paths" />
                <FactRow ok={true} text="Shows how many entries each station received per day" />
                <FactRow ok={true} text="Supports demand forecasting at the station level" />
                <FactRow ok={true} text="Enables comparison of stations by busy-ness" />
              </ul>
            </div>
          </div>
        </div>

        {/* Data sources */}
        <section>
          <SectionHeader icon={Database} title="Data Sources" />
          <div className="space-y-4">
            <DataSource
              title="Daily Station Demand"
              badge="Official"
              badgeColor="#2DC653"
              description="Daily station-entry / validation counts for Baku Metro stations for 2025–2026. Published by the Baku Metropolitan. Each row represents the total number of passengers who validated entry at a station on that date."
              fields={["date", "station_id", "entries", "source_year"]}
              frequency="Daily"
            />
            <DataSource
              title="Station Exit Coordinates"
              badge="Official"
              badgeColor="#2DC653"
              description="Exit-level geospatial data for Baku Metro stations, including exit number, label, address, and coordinates. Used for best-exit recommendations."
              fields={["exit_no", "exit_label", "address", "lat", "lon", "accessible"]}
              frequency="Updated when exits change"
            />
            <DataSource
              title="Weather Observations"
              badge="City Center"
              badgeColor="#2196F3"
              description="Weather observations for Baku City Center, updated every 3 hours. Used as exogenous features in our demand forecasting model. Includes temperature, humidity, wind speed, and precipitation."
              fields={["temp_c", "feels_like_c", "humidity", "wind_speed", "precipitation", "condition"]}
              frequency="Every 3 hours"
            />
          </div>
        </section>

        {/* Forecasting methodology */}
        <section>
          <SectionHeader icon={RefreshCw} title="Forecasting Methodology" />
          <div className="rounded-xl border border-white/5 bg-surface-800 p-5 space-y-4 text-sm text-muted-foreground leading-relaxed">
            <div>
              <p className="font-semibold text-foreground mb-1">Model</p>
              <p>
                Station-level demand forecasts are generated using a LightGBM
                gradient-boosted model trained on the historical daily station
                entry data, enriched with weather observations and temporal
                features.
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Features used</p>
              <ul className="list-disc list-inside space-y-0.5 text-xs">
                <li>Day of week, is_weekend, month, day_of_year</li>
                <li>lag_1 (yesterday&apos;s entries), lag_7 (same day last week)</li>
                <li>rolling_avg_7, rolling_avg_14, rolling_std_7</li>
                <li>temperature, humidity, precipitation, wind_speed</li>
                <li>Station identity and station type</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Output</p>
              <p>
                Each forecast includes a point estimate (predicted entries),
                uncertainty bounds (lower/upper), a confidence level, and a
                weather effect score (−1 to +1).
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Simple flow (demo explanation)</p>
              <ol className="list-decimal list-inside space-y-0.5 text-xs">
                <li>Load official station-entry history for each station.</li>
                <li>Build temporal features and join recent weather observations.</li>
                <li>Predict upcoming station entries and compute confidence bounds.</li>
                <li>Label demand as low, normal, high, or surge against baseline.</li>
              </ol>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Baseline</p>
              <p>
                Demand is compared against a rolling 7-day average and a
                day-of-week baseline. The delta is used to classify stations as
                quieter than usual, normal, busier than usual, or surge.
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-surface-900/60 px-3 py-2 text-xs">
              Weather-informed forecasting means weather contributes to station-demand estimates. It does not change the scope to journey tracing.
            </div>
          </div>
        </section>

        {/* Intraday profile */}
        <section>
          <SectionHeader icon={Info} title="Estimated Intraday Profiles" />
          <div className="rounded-xl border border-white/5 bg-surface-800 p-5 text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              Because the official dataset is daily — not hourly — this product
              does <strong className="text-foreground">not</strong> have access
              to real observed hourly entry counts.
            </p>
            <p>
              Instead we use an{" "}
              <strong className="text-foreground">
                estimated intraday profile
              </strong>{" "}
              system. Each station is assigned a profile type (e.g.
              commuter-heavy, central, residential) which maps to a typical
              hourly share distribution. This distribution is multiplied by the
              day&apos;s forecast total to produce estimated hourly figures.
            </p>
            <div className="rounded-lg bg-surface-600 px-4 py-3 text-xs">
              <p className="font-semibold text-foreground mb-1">
                Language used for estimated intraday data
              </p>
              <ul className="space-y-1 text-muted-foreground">
                <li>✓ &ldquo;Estimated intraday demand profile&rdquo;</li>
                <li>✓ &ldquo;Expected crowd window&rdquo;</li>
                <li>✓ &ldquo;Likely quieter period&rdquo;</li>
                <li>✓ &ldquo;Modeled from daily totals and station profile patterns&rdquo;</li>
                <li>✗ NOT &ldquo;Exact observed hourly count&rdquo;</li>
                <li>✗ NOT &ldquo;Real-time occupancy&rdquo;</li>
              </ul>
            </div>
          </div>
        </section>

        {/* What we can and cannot claim */}
        <section>
          <SectionHeader icon={CheckCircle} title="What MetroPulse Can and Cannot Claim" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-demand-low/20 bg-demand-low/5 p-4">
              <p className="text-xs font-bold text-demand-low uppercase tracking-wider mb-3">
                We CAN show
              </p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {[
                  "How many passengers entered a station per day",
                  "Which stations are busiest on average",
                  "Demand forecast for the next several days",
                  "How today compares to the typical baseline",
                  "Which exits are near your destination",
                  "Estimated rush windows based on station profile",
                  "How weather may shift demand levels",
                ].map((item) => (
                  <li key={item} className="flex gap-1.5">
                    <span className="text-demand-low mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-demand-surge/20 bg-demand-surge/5 p-4">
              <p className="text-xs font-bold text-demand-surge uppercase tracking-wider mb-3">
                We CANNOT show
              </p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {[
                  "Where individual passengers traveled to",
                  "Complete origin-destination trip data",
                  "Real-time carriage or platform occupancy",
                  "Exact observed hourly counts",
                  "Passenger path or route reconstruction",
                  "Dwell time or journey duration",
                  "Transfer patterns between lines",
                ].map((item) => (
                  <li key={item} className="flex gap-1.5">
                    <span className="text-demand-surge mt-0.5">✗</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section>
          <SectionHeader icon={Info} title="Official Open Data Usage" />
          <div className="rounded-xl border border-white/5 bg-surface-800 p-5 text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              MetroPulse Baku uses official open station-entry data published by public sources.
              This data is aggregated at station/day level and is suitable for station-demand intelligence.
            </p>
            <p>
              Because source data is aggregated, MetroPulse does not infer who traveled where,
              and does not provide origin-destination reconstruction.
            </p>
          </div>
        </section>

        {/* Update frequencies */}
        <section>
          <SectionHeader icon={RefreshCw} title="Update Schedule" />
          <div className="rounded-xl border border-white/5 bg-surface-800 divide-y divide-white/5 overflow-hidden">
            {[
              { label: "Station daily demand", freq: "Next day after metro close" },
              { label: "Demand forecasts", freq: "Daily, regenerated each morning" },
              { label: "Baselines (7-day, 30-day rolling)", freq: "Daily" },
              { label: "Weather observations", freq: "Every 3 hours" },
              { label: "Station exit data", freq: "Updated when exits change" },
              { label: "Intraday profiles", freq: "Updated quarterly or on pattern change" },
            ].map(({ label, freq }) => (
              <div key={label} className="flex flex-col gap-1 px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <span className="text-foreground">{label}</span>
                <span className="text-muted-foreground text-xs">{freq}</span>
              </div>
            ))}
          </div>
        </section>

        <p className="text-xs text-muted-foreground text-center pb-8">
          Questions or corrections?{" "}
          <Link href="/" className="text-metro-blue underline underline-offset-2">
            Return to dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-4 w-4 text-metro-blue" />
      <h2 className="text-base font-bold text-foreground">{title}</h2>
    </div>
  );
}

function FactRow({ ok, text }: { ok: boolean; text: string }) {
  return (
    <li className="flex gap-2 text-xs">
      <span className={ok ? "text-demand-low" : "text-demand-surge"}>
        {ok ? "✓" : "✗"}
      </span>
      <span>{text}</span>
    </li>
  );
}

function DataSource({
  title,
  badge,
  badgeColor,
  description,
  fields,
  frequency,
}: {
  title: string;
  badge: string;
  badgeColor: string;
  description: string;
  fields: string[];
  frequency: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-surface-800 p-5">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ backgroundColor: badgeColor + "22", color: badgeColor }}
        >
          {badge}
        </span>
        <span className="text-xs text-muted-foreground ml-auto">
          {frequency}
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
        {description}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {fields.map((f) => (
          <code
            key={f}
            className="text-[10px] bg-surface-600 border border-white/5 rounded px-1.5 py-0.5 text-muted-foreground font-mono"
          >
            {f}
          </code>
        ))}
      </div>
    </div>
  );
}
