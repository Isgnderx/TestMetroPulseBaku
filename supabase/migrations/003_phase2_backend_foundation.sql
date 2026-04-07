-- ============================================================
-- MetroPulse Baku - Phase 2 Backend Foundation
-- PostgreSQL + PostGIS contract-hardening migration
-- ============================================================
-- Purpose:
-- 1. Harden table contracts for API integration.
-- 2. Ensure PostGIS geometry + geography support for map queries.
-- 3. Add consistency constraints and operational indexes.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Keep updated_at consistent across domain tables.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------
-- stations
-- -----------------------------------------------------------------
ALTER TABLE public.stations
ADD COLUMN IF NOT EXISTS geog GEOGRAPHY (Point, 4326);

UPDATE public.stations
SET
  geom = ST_SetSRID(ST_MakePoint(lon, lat), 4326),
  geog = ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography
WHERE geom IS NULL OR geog IS NULL;

ALTER TABLE public.stations
ALTER COLUMN geom
SET
    NOT NULL,
ALTER COLUMN geog
SET
    NOT NULL;

CREATE OR REPLACE FUNCTION public.stations_set_spatial()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.geom = ST_SetSRID(ST_MakePoint(NEW.lon, NEW.lat), 4326);
  NEW.geog = NEW.geom::geography;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stations_geom_trigger ON public.stations;

CREATE TRIGGER stations_spatial_trigger
BEFORE INSERT OR UPDATE ON public.stations
FOR EACH ROW EXECUTE FUNCTION public.stations_set_spatial();

DROP TRIGGER IF EXISTS stations_updated_at_trigger ON public.stations;

CREATE TRIGGER stations_updated_at_trigger
BEFORE UPDATE ON public.stations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS stations_geog_idx ON public.stations USING GIST (geog);

COMMENT ON
TABLE public.stations IS 'Baku Metro stations for station-entry demand analytics only (not journey tracing).';

COMMENT ON COLUMN public.stations.geom IS 'WGS84 geometry point used for PostGIS map operations.';

COMMENT ON COLUMN public.stations.geog IS 'WGS84 geography point used for distance calculations in meters.';

-- -----------------------------------------------------------------
-- station_exits
-- -----------------------------------------------------------------
ALTER TABLE public.station_exits
ADD COLUMN IF NOT EXISTS geog GEOGRAPHY (Point, 4326);

UPDATE public.station_exits
SET
  geom = ST_SetSRID(ST_MakePoint(lon, lat), 4326),
  geog = ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography
WHERE geom IS NULL OR geog IS NULL;

ALTER TABLE public.station_exits
ALTER COLUMN geom
SET
    NOT NULL,
ALTER COLUMN geog
SET
    NOT NULL;

CREATE OR REPLACE FUNCTION public.station_exits_set_spatial()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.geom = ST_SetSRID(ST_MakePoint(NEW.lon, NEW.lat), 4326);
  NEW.geog = NEW.geom::geography;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS exits_geom_trigger ON public.station_exits;

CREATE TRIGGER station_exits_spatial_trigger
BEFORE INSERT OR UPDATE ON public.station_exits
FOR EACH ROW EXECUTE FUNCTION public.station_exits_set_spatial();

DROP TRIGGER IF EXISTS station_exits_updated_at_trigger ON public.station_exits;

CREATE TRIGGER station_exits_updated_at_trigger
BEFORE UPDATE ON public.station_exits
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS station_exits_geog_idx ON public.station_exits USING GIST (geog);

COMMENT ON
TABLE public.station_exits IS 'Station exits with map coordinates used for rider-facing entry/exit guidance.';

-- -----------------------------------------------------------------
-- station_daily_demand
-- -----------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'station_daily_demand_entries_non_negative'
  ) THEN
    ALTER TABLE public.station_daily_demand
      ADD CONSTRAINT station_daily_demand_entries_non_negative
      CHECK (entries >= 0) NOT VALID;
  END IF;
END
$$;

ALTER TABLE public.station_daily_demand VALIDATE CONSTRAINT station_daily_demand_entries_non_negative;

CREATE INDEX IF NOT EXISTS station_daily_demand_station_date_idx ON public.station_daily_demand (station_id, date DESC);

COMMENT ON
TABLE public.station_daily_demand IS 'Official daily station-entry counts. Core demand baseline table.';

-- -----------------------------------------------------------------
-- weather_city_center
-- -----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS weather_city_center_condition_idx ON public.weather_city_center (condition);

COMMENT ON
TABLE public.weather_city_center IS 'Observed weather snapshots for Baku city center used as forecast context features.';

-- -----------------------------------------------------------------
-- station_forecasts
-- -----------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'station_forecasts_non_negative_values'
  ) THEN
    ALTER TABLE public.station_forecasts
      ADD CONSTRAINT station_forecasts_non_negative_values
      CHECK (
        predicted_entries >= 0
        AND COALESCE(lower_bound, 0) >= 0
        AND COALESCE(upper_bound, 0) >= 0
        AND COALESCE(baseline_entries, 0) >= 0
      ) NOT VALID;
  END IF;
END
$$;

ALTER TABLE public.station_forecasts VALIDATE CONSTRAINT station_forecasts_non_negative_values;

DROP TRIGGER IF EXISTS station_forecasts_updated_at_trigger ON public.station_forecasts;

CREATE TRIGGER station_forecasts_updated_at_trigger
BEFORE UPDATE ON public.station_forecasts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS station_forecasts_station_date_idx ON public.station_forecasts (
    station_id,
    forecast_date DESC
);

COMMENT ON
TABLE public.station_forecasts IS 'Predicted daily station-entry demand with model metadata and confidence bounds.';

-- -----------------------------------------------------------------
-- station_intraday_profiles
-- -----------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS station_intraday_profiles_station_id_uidx ON public.station_intraday_profiles (station_id);

DROP TRIGGER IF EXISTS station_intraday_profiles_updated_at_trigger ON public.station_intraday_profiles;

CREATE TRIGGER station_intraday_profiles_updated_at_trigger
BEFORE UPDATE ON public.station_intraday_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON
TABLE public.station_intraday_profiles IS 'Estimated intraday entry-share distributions by station profile type.';

COMMENT ON COLUMN public.station_intraday_profiles.weekday_pattern_json IS 'JSON array: [{"hour":number,"share":number}] for weekdays.';

COMMENT ON COLUMN public.station_intraday_profiles.weekend_pattern_json IS 'JSON array: [{"hour":number,"share":number}] for weekends.';