-- ============================================================
-- MetroPulse Baku - Production Database Schema
-- PostgreSQL + PostGIS
-- ============================================================
-- Notes:
--   This schema supports station-entry / validation data only.
--   It does NOT model origin-destination journeys.
--   Demand analytics are at the station level only.
-- ============================================================

-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- ────────────────────────────────────────────────────────────
-- 1. STATIONS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stations (
    id TEXT PRIMARY KEY, -- e.g. 'st-001'
    slug TEXT UNIQUE NOT NULL, -- URL-safe identifier
    name TEXT NOT NULL, -- display name
    name_az TEXT, -- Azerbaijani name
    line TEXT NOT NULL CHECK (
        line IN ('red', 'green', 'purple')
    ),
    lat DOUBLE PRECISION NOT NULL,
    lon DOUBLE PRECISION NOT NULL,
    geom GEOMETRY (Point, 4326), -- PostGIS point
    station_type TEXT CHECK (
        station_type IN (
            'commuter',
            'transfer',
            'residential',
            'mixed',
            'central',
            'tourist',
            'business'
        )
    ),
    opened_year INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Geospatial index
CREATE INDEX IF NOT EXISTS stations_geom_idx ON stations USING GIST (geom);

CREATE INDEX IF NOT EXISTS stations_slug_idx ON stations (slug);

CREATE INDEX IF NOT EXISTS stations_line_idx ON stations (line);

-- Auto-populate geom from lat/lon
CREATE OR REPLACE FUNCTION stations_set_geom()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geom = ST_SetSRID(ST_MakePoint(NEW.lon, NEW.lat), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER stations_geom_trigger
BEFORE INSERT OR UPDATE ON stations
FOR EACH ROW EXECUTE FUNCTION stations_set_geom();

-- ────────────────────────────────────────────────────────────
-- 2. STATION DAILY DEMAND
--    Station-entry / validation counts per day.
--    This is the core dataset. NOT origin-destination data.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS station_daily_demand (
    date DATE NOT NULL,
    station_id TEXT NOT NULL REFERENCES stations (id) ON DELETE CASCADE,
    entries INTEGER NOT NULL CHECK (entries >= 0),
    source_year INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (date, station_id)
);

CREATE INDEX IF NOT EXISTS sdd_station_id_idx ON station_daily_demand (station_id);

CREATE INDEX IF NOT EXISTS sdd_date_idx ON station_daily_demand (date DESC);

-- ────────────────────────────────────────────────────────────
-- 3. STATION EXITS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS station_exits (
    id TEXT PRIMARY KEY,
    station_id TEXT NOT NULL REFERENCES stations (id) ON DELETE CASCADE,
    exit_no INTEGER NOT NULL,
    exit_label TEXT NOT NULL,
    address_text TEXT,
    lat DOUBLE PRECISION NOT NULL,
    lon DOUBLE PRECISION NOT NULL,
    geom GEOMETRY (Point, 4326),
    is_accessible BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (station_id, exit_no)
);

CREATE INDEX IF NOT EXISTS exits_station_id_idx ON station_exits (station_id);

CREATE INDEX IF NOT EXISTS exits_geom_idx ON station_exits USING GIST (geom);

-- Auto-populate geom
CREATE OR REPLACE FUNCTION exits_set_geom()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geom = ST_SetSRID(ST_MakePoint(NEW.lon, NEW.lat), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER exits_geom_trigger
BEFORE INSERT OR UPDATE ON station_exits
FOR EACH ROW EXECUTE FUNCTION exits_set_geom();

-- ────────────────────────────────────────────────────────────
-- 4. WEATHER (CITY CENTER, 3-HOURLY)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weather_city_center (
    observed_at TIMESTAMPTZ NOT NULL PRIMARY KEY,
    temp_c REAL,
    feels_like_c REAL,
    humidity REAL, -- percent
    wind_speed REAL, -- km/h
    precipitation REAL, -- mm
    pressure REAL, -- hPa
    condition TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS weather_observed_at_idx ON weather_city_center (observed_at DESC);

-- ────────────────────────────────────────────────────────────
-- 5. STATION FORECASTS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS station_forecasts (
  id                   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  station_id           TEXT NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  forecast_date        DATE NOT NULL,
  predicted_entries    INTEGER NOT NULL,
  lower_bound          INTEGER,
  upper_bound          INTEGER,
  model_name           TEXT NOT NULL,
  model_version        TEXT NOT NULL,
  confidence_level     REAL CHECK (confidence_level BETWEEN 0 AND 1),
  weather_effect_score REAL CHECK (weather_effect_score BETWEEN -1 AND 1),
  baseline_entries     INTEGER,
  rider_facing_note    TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (station_id, forecast_date, model_name, model_version)
);

CREATE INDEX IF NOT EXISTS forecasts_station_id_idx ON station_forecasts (station_id);

CREATE INDEX IF NOT EXISTS forecasts_date_idx ON station_forecasts (forecast_date DESC);

-- ────────────────────────────────────────────────────────────
-- 6. STATION INTRADAY PROFILES
--    Estimated hourly share distributions per station.
--    These are modeled estimates from daily totals and station
--    category — NOT observed hourly counts.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS station_intraday_profiles (
  id                    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  station_id            TEXT NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  profile_type          TEXT NOT NULL CHECK (profile_type IN (
                          'commuter-heavy', 'transfer-heavy', 'residential',
                          'mixed-use', 'central'
                        )),
  weekday_pattern_json  JSONB NOT NULL,  -- [{hour, share}, ...]
  weekend_pattern_json  JSONB NOT NULL,
  confidence_note       TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (station_id)
);

CREATE INDEX IF NOT EXISTS profiles_station_id_idx ON station_intraday_profiles (station_id);

-- ────────────────────────────────────────────────────────────
-- 7. STATION BASELINES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS station_baselines (
    station_id TEXT NOT NULL REFERENCES stations (id) ON DELETE CASCADE,
    dow INTEGER NOT NULL CHECK (dow BETWEEN 0 AND 6), -- 0=Sunday
    avg_entries REAL,
    median_entries REAL,
    rolling_avg_7 REAL,
    rolling_avg_30 REAL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (station_id, dow)
);

CREATE INDEX IF NOT EXISTS baselines_station_idx ON station_baselines (station_id);

-- ────────────────────────────────────────────────────────────
-- VIEWS
-- ────────────────────────────────────────────────────────────

-- Today's demand snapshot (latest forecast per station)
CREATE OR REPLACE VIEW v_today_demand AS
SELECT
  s.id,
  s.slug,
  s.name,
  s.line,
  s.station_type,
  s.lat,
  s.lon,
  f.predicted_entries,
  f.lower_bound,
  f.upper_bound,
  f.confidence_level,
  f.weather_effect_score,
  f.baseline_entries,
  f.rider_facing_note,
  CASE
    WHEN f.baseline_entries > 0 THEN
      ROUND((((f.predicted_entries - f.baseline_entries)::NUMERIC / f.baseline_entries::NUMERIC) * 100), 1)
    ELSE 0
  END AS delta_pct
FROM stations s
LEFT JOIN station_forecasts f ON
  f.station_id = s.id
  AND f.forecast_date = CURRENT_DATE;

-- ────────────────────────────────────────────────────────────
-- HELPER: distance-ranked exits for a given point
-- ────────────────────────────────────────────────────────────
-- Usage: SELECT * FROM fn_ranked_exits('st-003', 49.85, 40.38);
CREATE OR REPLACE FUNCTION fn_ranked_exits(
  p_station_id TEXT,
  p_dest_lon   DOUBLE PRECISION,
  p_dest_lat   DOUBLE PRECISION
)
RETURNS TABLE (
  exit_id       TEXT,
  exit_no       INTEGER,
  exit_label    TEXT,
  address_text  TEXT,
  is_accessible BOOLEAN,
  distance_m    DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.exit_no,
    e.exit_label,
    e.address_text,
    e.is_accessible,
    ST_Distance(
      e.geom::geography,
      ST_SetSRID(ST_MakePoint(p_dest_lon, p_dest_lat), 4326)::geography
    ) AS distance_m
  FROM station_exits e
  WHERE e.station_id = p_station_id
  ORDER BY distance_m ASC;
END;
$$ LANGUAGE plpgsql;