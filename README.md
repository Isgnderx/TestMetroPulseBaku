# MetroPulse Baku

Station-demand intelligence for the Baku Metro — real-time forecasts, interactive map, and weather-adjusted demand insights.

> **Data note:** All figures are station-entry counts and forecasts — not origin-destination journey data. Intraday breakdowns are estimated distributions, not observed per-hour counts.

## Demo Elevator Pitch

MetroPulse Baku helps riders and operators understand station crowd pressure before arrival.
It combines official station-entry open data, weather-informed forecasting, and clear confidence-aware summaries.

## Product Truth (Always)

- Station-demand intelligence only.
- Not journey tracing.
- Not origin-destination reconstruction.
- Intraday windows are modeled estimates from daily totals.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS, custom dark design tokens |
| Map | MapLibre GL JS (OSM tiles, no token required) |
| Charts | Recharts (client-only via `next/dynamic`) |
| Database | Supabase (PostgreSQL + PostGIS) |
| ETL | Python 3.11+ scripts |
| Forecasting | Station-level XGBoost + baselines + weather-informed features |

---

## Prerequisites

- Node.js 18+
- npm 9+
- Python 3.11+
- A [Supabase](https://supabase.com) project (free tier works)
- OpenWeatherMap API key (free) — only needed for live weather ingestion

---

## 1. Clone & install

```bash
git clone https://github.com/your-org/metropulse-baku.git
cd metropulse-baku
npm install
```

---

## 2. Environment variables

Copy the example file and fill in your credentials:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only) |
| `DATABASE_URL` | Python scripts only | Full PostgreSQL connection string |
| `OPENWEATHER_KEY` | Optional | OpenWeatherMap API key for live weather |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Optional | Only needed if replacing OSM tiles with Mapbox |

---

## 3. Database setup

In your Supabase project, open the **SQL Editor** and run the migration:

```bash
# Contents of supabase/migrations/001_initial_schema.sql
```

Or use the Supabase CLI:

```bash
npx supabase db push
```

This creates:
- `stations` table with PostGIS geometry
- `station_daily_demand`, `station_forecasts`, `station_baselines`
- `weather_city_center`
- `station_exits`, `station_intraday_profiles`
- View `v_today_demand`
- Function `fn_ranked_exits()` for geospatial exit ranking

---

## 4. Python ETL scripts

Install Python dependencies:

```bash
pip install -r requirements.txt
```

### Full pipeline (recommended)

```bash
python scripts/run_pipeline.py \
  --demand-file data/daily_demand.csv \
  --exits-file data/station_exits.csv \
  --weather-source api
```

Options:
- `--demand-file PATH` — path to demand CSV (station-entry rows)
- `--demand-year YYYY` — source year metadata stored in `station_daily_demand`
- `--exits-file PATH` — path to exits CSV
- `--skip-weather` — skip weather ingestion step
- `--weather-source api|csv` — use OpenWeatherMap API or local weather CSV
- `--weather-file PATH` — path to weather CSV (required when `--weather-source csv`)
- `--dry-run` — run validation, normalization, and dedup without DB writes

### ETL module structure

```text
scripts/
  etl/
    config.py               # env-based configuration for local/supabase DB
    db.py                   # SQLAlchemy DB access and upsert functions
    normalization.py        # station name normalization and fuzzy matching
    validators.py           # coordinate/date/boolean validation helpers
    jobs/
      daily_demand_job.py   # station-entry demand CSV ingest
      exits_job.py          # station exits CSV ingest
      weather_job.py        # weather CSV/API ingest
```

### ETL guarantees

- Station-demand ingest handles daily station-entry counts only (not OD journey data).
- Station names are normalized through a canonical mapping + fuzzy fallback.
- Coordinate validation is enforced for Baku bounds before exit rows are loaded.
- Deduplication is applied before writes:
  - Demand: `(date, station_id)`
  - Exits: `(station_id, exit_no)`
  - Weather: `observed_at`
- Loaders use idempotent upserts for safe reruns.

### Individual scripts

```bash
# Ingest daily demand CSV
python scripts/ingest_daily_demand.py --file data/daily_demand.csv --year 2025

# Ingest exits CSV
python scripts/ingest_exits.py --file data/station_exits.csv

# Ingest weather (API)
python scripts/ingest_weather.py --source api

# Ingest weather (CSV)
python scripts/ingest_weather.py --source csv --file data/weather.csv

# Normalize a station name to its canonical slug
python scripts/normalize_stations.py --name "28 May"
```

### Forecasting engine scripts (Phase 4)

```bash
# Train baseline-vs-XGBoost station demand model and persist artifact
python scripts/train_forecasting_model.py --station all

# Evaluate saved model on recent holdout window
python scripts/evaluate_forecasting_model.py --model models/station_demand_xgb.joblib --holdout-days 30

# Generate next-day forecasts and write rows to station_forecasts
python scripts/generate_station_forecasts.py --model models/station_demand_xgb.joblib

# Backward-compatible wrapper (next-day only)
python scripts/forecast_demand.py --station all
```

Forecast features include:
- day_of_week
- is_weekend
- month
- day_of_year
- lag_1
- lag_7
- rolling_avg_7
- rolling_avg_14
- rolling_std_7
- temperature
- humidity
- precipitation
- wind_speed
- station identity (categorical)
- station type (optional categorical)

Modeling flow:
- Baseline: lag_7 and rolling average blend
- Main model: XGBoost regressor
- Evaluation metrics: MAE and MAPE
- Uncertainty: residual-based interval heuristic + confidence score
- Weather effect: delta between actual-weather prediction and neutral-weather prediction

### Expected CSV format — daily demand

```csv
date,station_name,entries
2025-01-01,28 May,32100
2025-01-01,Sahil,18900
...
```

### Expected CSV format — station exits

```csv
station_name,exit_no,exit_label,address_text,lat,lon,is_accessible
28 May,1,Exit 1 - 28 May Street,28 May kucesi,40.3799,49.8523,true
Nizami,2,Exit 2 - Fountains Square,Seher merkezi,40.3819,49.8448,true
```

### Expected CSV format — weather

```csv
observed_at,temp_c,feels_like_c,humidity,wind_speed,precipitation,pressure,condition
2025-01-01T12:00:00Z,8.2,5.1,72,14.4,0.0,1015,clear
...
```

---

## 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Quick demo flow

1. Open home page and explain scope truth (station-demand intelligence only).
2. Open map and click 2-3 stations to show demand-level color/size cues.
3. Open one station page to show:
  - forecast confidence badge,
  - estimated intraday windows,
  - best-exit suggestions.
4. Open about-data page to present transparency and limitations.

---

## 6. Build for production

```bash
npm run build
npm start
```

The build generates static pages for all 20 station routes (`/station/[slug]`).

---

## Project structure

```
metropulse-baku/
├── app/
│   ├── page.tsx                    # Home — leaderboard + map entry
│   ├── map/page.tsx                # Interactive MapLibre map
│   ├── station/[slug]/page.tsx     # Station detail (server component)
│   ├── compare/page.tsx            # Side-by-side station comparison
│   ├── leaderboard/page.tsx        # Demand leaderboard
│   ├── insights/page.tsx           # Weather vs demand insights
│   ├── about-data/page.tsx         # Data transparency page
│   └── api/
│       └── stations/[slug]/
│           ├── route.ts            # Station detail API
│           ├── forecast/route.ts   # Forecast API
│           ├── history/route.ts    # History API
│           └── best-exits/route.ts # Ranked exits API
├── components/
│   ├── layout/                     # Navbar, Footer
│   ├── charts/                     # Recharts wrappers (client-only)
│   ├── map/                        # MetroMap (MapLibre)
│   ├── station/                    # StationCard, StationSearch
│   ├── weather/                    # WeatherWidget
│   └── ui/                         # Badge, Card, Skeleton, Alert
├── data/
│   └── mock.ts                     # 20 stations with mock demand/forecasts
├── lib/
│   └── utils.ts                    # Forecast enrichment, intraday estimates
├── scripts/
│   ├── run_pipeline.py             # Orchestrator
│   ├── ingest_daily_demand.py      # CSV → station_daily_demand
│   ├── ingest_weather.py           # API/CSV → weather_city_center
│   ├── build_baselines.py          # DOW baselines → station_baselines
│   ├── forecast_demand.py          # Forecasts → station_forecasts
│   └── normalize_stations.py       # Station name normalization utility
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Full DB schema
├── types/index.ts                  # Domain type system
├── .env.example                    # Environment variable template
└── requirements.txt                # Python dependencies
```

---

## Pages

| Route | Description |
|---|---|
| `/` | Home — top-demand stations, map teaser |
| `/map` | Interactive metro map with demand-colored markers |
| `/station/[slug]` | Station detail — forecasts, intraday chart, exits, weather |
| `/compare` | Side-by-side demand comparison of two stations |
| `/leaderboard` | Stations ranked by today's demand |
| `/insights` | Weather vs demand correlation charts |
| `/about-data` | Data sources, methodology, limitations |

---

## API routes

| Endpoint | Description |
|---|---|
| `GET /api/stations/[slug]` | Full station detail with forecast + exits |
| `GET /api/stations/[slug]/forecast` | 7-day forecast array |
| `GET /api/stations/[slug]/history` | 30-day daily demand history |
| `GET /api/stations/[slug]/best-exits` | Geospatially ranked exits |

---

## Data sources

- **Daily demand:** Official Baku Metro entry counts (station-level only)
- **Weather:** OpenWeatherMap API (Baku city center)
- **Station coordinates:** Public Baku Metro network data
- **Forecasting:** Station-level ML forecast with confidence bounds and weather-informed features

---

## Simple Methodology (Presentation Version)

1. Ingest official daily station-entry data.
2. Join weather observations and temporal features.
3. Predict next-day station demand with confidence bounds.
4. Estimate intraday windows from station profile templates.
5. Present recommendations with transparent limitations.

---

## Transparency Notes

- The app is designed for station-entry demand awareness and planning.
- Intraday charts are estimated distributions, not direct hourly observations.
- Weather affects forecasts as one input signal.
- MetroPulse does not infer complete passenger journey paths.

---

## License

MIT
