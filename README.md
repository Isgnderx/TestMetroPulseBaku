# MetroPulse Baku

Station-level demand intelligence platform for the Baku Metro.

MetroPulse Baku provides near real-time station pressure indicators, short-term demand forecasts, an interactive metro map, weather-aware insights, station exit recommendations, an ETL/ML pipeline, and a separate people counter module.

## Project Scope

MetroPulse Baku is built to help riders and operators understand crowd pressure before arrival.

This project does:
- focus on station-level daily entry demand,
- provide forecasts with confidence context,
- surface practical insights for better timing and exit choice.

This project does not:
- reconstruct origin-destination journeys,
- track individual passengers,
- infer full trip paths for a person.

## Core Features

- Modern web architecture using Next.js 15 App Router
- Interactive metro map (MapLibre) with demand-level visualization
- Station detail pages with:
  - historical trend,
  - 7-day forecast,
  - best-time insight,
  - best-exit recommendation,
  - weather impact notes
- Supabase-first live data layer with mock fallback
- Python ETL pipeline for ingestion and model lifecycle
- Station demand forecasting with XGBoost
- Separate people counter module (YOLO + ByteTrack)

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript |
| UI | Tailwind CSS, Radix UI, Framer Motion, Lucide |
| Visualization | Recharts, MapLibre GL |
| Backend/Data API | Next.js API routes |
| Database | Supabase (PostgreSQL) |
| ETL/ML | Python 3.11+, pandas, SQLAlchemy, xgboost |
| Computer Vision (module) | Ultralytics YOLO, ByteTrack, OpenCV |

## High-Level Architecture

```text
Browser (Next.js UI)
   |
   v
App Router Pages (/, /map, /station/[slug], /insights, /leaderboard, /compare)
   |
   v
API Routes (app/api/**)
   |
   +--> lib/server/live-api.ts   -> Supabase
   |
   +--> lib/server/mock-api.ts   -> CSV/mock fallback
   |
   +--> lib/server/explanations  -> OpenRouter optional

Python ETL (scripts/**) -> Supabase tables
ML model artifacts (models/**) -> Forecast generation

People Counter (people_counter/**) -> CCTV/RTSP line-crossing counting
```

## Directory Structure

```text
app/                 # Next.js pages and API routes
components/          # UI, chart, map, and station components
lib/                 # Server/client helpers and business logic
data/                # Mock data files
scripts/             # ETL and forecasting scripts
supabase/            # SQL migrations and seed
models/              # Trained model artifacts
people_counter/      # CV-based people counting module
types/               # Type and contract definitions
```

## Getting Started

### 1) Requirements

- Node.js 18+
- npm 9+
- Python 3.11+
- Supabase project

### 2) Install JavaScript dependencies

```bash
npm install
```

### 3) Install Python dependencies

```bash
pip install -r requirements.txt
```

### 4) Create environment file

Create a .env.local file in the project root.

Minimum required variables:

| Variable | Required | Note |
|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | Yes | Supabase project URL |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY | Yes | Browser/SSR publishable key |
| SUPABASE_SECRET_KEY | Recommended | Elevated server-side access |
| DATABASE_URL | Yes for ETL | PostgreSQL connection string |

Fallback or optional variables:

| Variable | Note |
|---|---|
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Legacy fallback |
| SUPABASE_SERVICE_ROLE_KEY | Legacy fallback |
| OPENWEATHER_KEY | Optional weather API key |
| OPENROUTER_API_KEY | Optional AI explanation key |
| OPENROUTER_MODEL | Default: openai/gpt-4o-mini |
| OPENROUTER_HTTP_REFERER | Optional |
| OPENROUTER_APP_TITLE | Optional |
| OPENROUTER_CACHE_TTL_SECONDS | Optional |
| DEMO_SAFE_MODE | Optional |
| NEXT_PUBLIC_DEMO_SAFE_MODE | Optional |
| DEMO_SAFE_TIMEOUT_MS | Optional |
| NEXT_PUBLIC_DEMO_SAFE_TIMEOUT_MS | Optional |
| BAKU_CENTER_LAT | ETL weather default: 40.4093 |
| BAKU_CENTER_LON | ETL weather default: 49.8671 |
| WEATHER_CITY | ETL weather default: Baku |
| ETL_LOG_LEVEL | ETL default: INFO |

## Supabase Setup

Migrations are located in [supabase/migrations](supabase/migrations).

Using CLI:

```bash
npx supabase db push
```

You can also apply migration files manually in Supabase SQL Editor, in order.

## Local Run

Development mode:

```bash
npm run dev
```

Production build test:

```bash
npm run build
npm run start
```

Quality checks:

```bash
npm run lint
npm run type-check
```

## ETL and Forecasting Workflow

### Full pipeline (recommended)

```bash
python scripts/run_pipeline.py --demand-file passenger_2025.csv --weather-source api
```

Main scripts:

- scripts/ingest_daily_demand.py
- scripts/ingest_exits.py
- scripts/ingest_weather.py
- scripts/build_baselines.py
- scripts/train_forecasting_model.py
- scripts/evaluate_forecasting_model.py
- scripts/generate_station_forecasts.py
- scripts/forecast_demand.py
- scripts/backfill_weather_archive.py

Forecast artifacts:

- models/station_demand_xgb.joblib
- models/station_demand_xgb.metrics.json

## Main API Endpoints

- GET /api/stations
- GET /api/stations/:slug
- GET /api/stations/:slug/history
- GET /api/stations/:slug/forecast
- GET /api/stations/:slug/best-time
- GET /api/stations/:slug/best-exits
- GET /api/leaderboard
- GET /api/insights/weather-vs-demand
- GET /api/weather/current

## People Counter Module

The people counter module is located in [people_counter](people_counter).

It supports:
- fixed CCTV/IP stream-based people counting,
- line crossing entry/exit events,
- zone occupancy tracking,
- RTSP input.

Install:

```bash
cd people_counter
pip install -r requirements.txt
```

Run example:

```bash
python main.py --source "rtsp://user:password@ip/stream" --model yolo11s.pt --device cuda:0
```

Run with config:

```bash
python main.py --config camera_config.example.json
```

Note: This module can also be deployed as an independent subsystem.

## Data and Methodology Notes

- Metrics are station-entry based.
- Intraday breakdowns are model/template estimates, not direct measured hourly truth.
- Weather is used as an input signal for forecasting.
- Insights are decision support, not absolute certainty.

## Troubleshooting

- If Supabase requests fail, verify environment variables first.
- If station pages mismatch by slug, check normalization mappings.
- If forecast values are null, verify model artifacts exist.
- If mock fallback breaks, check CSV paths and schema.
- If RTSP fails in people counter, verify stream URL, codec, and firewall.

## Roadmap Ideas

- real-time event streaming (WebSocket/SSE)
- stronger uncertainty modeling for forecasts
- persistent AI explanation cache
- direct people_counter event integration into the dashboard

## License

MIT
