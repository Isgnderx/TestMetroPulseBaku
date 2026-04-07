from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from typing import Sequence

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from etl.normalization import StationReference


@dataclass(frozen=True)
class DailyDemandRecord:
    date: date
    station_id: str
    entries: int
    source_year: int


@dataclass(frozen=True)
class ExitRecord:
    id: str
    station_id: str
    exit_no: int
    exit_label: str
    address_text: str
    lat: float
    lon: float
    is_accessible: bool


@dataclass(frozen=True)
class WeatherRecord:
    observed_at: datetime
    temp_c: float
    feels_like_c: float
    humidity: float
    wind_speed: float
    precipitation: float
    pressure: float
    condition: str


@dataclass(frozen=True)
class ForecastWriteRecord:
    station_id: str
    forecast_date: date
    predicted_entries: int
    baseline_entries: int
    lower_bound: int
    upper_bound: int
    confidence_level: float
    weather_effect_score: float
    model_name: str
    model_version: str
    rider_facing_note: str


def build_engine(database_url: str) -> Engine:
    return create_engine(database_url, future=True, pool_pre_ping=True)


def fetch_station_references(engine: Engine) -> list[StationReference]:
    sql = text(
        """
        SELECT id, slug, name, COALESCE(name_az, name) AS name_az
        FROM public.stations
        ORDER BY name
        """
    )

    with engine.begin() as conn:
        rows = conn.execute(sql).mappings().all()

    return [
        StationReference(
            id=row["id"],
            slug=row["slug"],
            name=row["name"],
            name_az=row["name_az"],
        )
        for row in rows
    ]


def upsert_station_daily_demand(engine: Engine, records: Sequence[DailyDemandRecord]) -> int:
    if not records:
        return 0

    sql = text(
        """
        INSERT INTO public.station_daily_demand (date, station_id, entries, source_year)
        VALUES (:date, :station_id, :entries, :source_year)
        ON CONFLICT (date, station_id) DO UPDATE SET
          entries = EXCLUDED.entries,
          source_year = EXCLUDED.source_year
        """
    )

    payload = [
        {
            "date": item.date,
            "station_id": item.station_id,
            "entries": item.entries,
            "source_year": item.source_year,
        }
        for item in records
    ]

    with engine.begin() as conn:
        conn.execute(sql, payload)

    return len(payload)


def upsert_station_exits(engine: Engine, records: Sequence[ExitRecord]) -> int:
    if not records:
        return 0

    sql = text(
        """
        INSERT INTO public.station_exits (
          id, station_id, exit_no, exit_label, address_text, lat, lon, is_accessible
        )
        VALUES (
          :id, :station_id, :exit_no, :exit_label, :address_text, :lat, :lon, :is_accessible
        )
        ON CONFLICT (station_id, exit_no) DO UPDATE SET
          exit_label = EXCLUDED.exit_label,
          address_text = EXCLUDED.address_text,
          lat = EXCLUDED.lat,
          lon = EXCLUDED.lon,
          is_accessible = EXCLUDED.is_accessible,
          updated_at = NOW()
        """
    )

    payload = [
        {
            "id": item.id,
            "station_id": item.station_id,
            "exit_no": item.exit_no,
            "exit_label": item.exit_label,
            "address_text": item.address_text,
            "lat": item.lat,
            "lon": item.lon,
            "is_accessible": item.is_accessible,
        }
        for item in records
    ]

    with engine.begin() as conn:
        conn.execute(sql, payload)

    return len(payload)


def upsert_weather_city_center(engine: Engine, records: Sequence[WeatherRecord]) -> int:
    if not records:
        return 0

    sql = text(
        """
        INSERT INTO public.weather_city_center (
          observed_at, temp_c, feels_like_c, humidity, wind_speed,
          precipitation, pressure, condition
        )
        VALUES (
          :observed_at, :temp_c, :feels_like_c, :humidity, :wind_speed,
          :precipitation, :pressure, :condition
        )
        ON CONFLICT (observed_at) DO UPDATE SET
          temp_c = EXCLUDED.temp_c,
          feels_like_c = EXCLUDED.feels_like_c,
          humidity = EXCLUDED.humidity,
          wind_speed = EXCLUDED.wind_speed,
          precipitation = EXCLUDED.precipitation,
          pressure = EXCLUDED.pressure,
          condition = EXCLUDED.condition
        """
    )

    payload = [
        {
            "observed_at": item.observed_at,
            "temp_c": item.temp_c,
            "feels_like_c": item.feels_like_c,
            "humidity": item.humidity,
            "wind_speed": item.wind_speed,
            "precipitation": item.precipitation,
            "pressure": item.pressure,
            "condition": item.condition,
        }
        for item in records
    ]

    with engine.begin() as conn:
        conn.execute(sql, payload)

    return len(payload)


def upsert_station_forecasts(engine: Engine, records: Sequence[ForecastWriteRecord]) -> int:
    if not records:
        return 0

    sql = text(
        """
        INSERT INTO public.station_forecasts (
          station_id,
          forecast_date,
          predicted_entries,
          lower_bound,
          upper_bound,
          model_name,
          model_version,
          confidence_level,
          weather_effect_score,
          baseline_entries,
          rider_facing_note
        )
        VALUES (
          :station_id,
          :forecast_date,
          :predicted_entries,
          :lower_bound,
          :upper_bound,
          :model_name,
          :model_version,
          :confidence_level,
          :weather_effect_score,
          :baseline_entries,
          :rider_facing_note
        )
        ON CONFLICT (station_id, forecast_date, model_name, model_version) DO UPDATE SET
          predicted_entries = EXCLUDED.predicted_entries,
          lower_bound = EXCLUDED.lower_bound,
          upper_bound = EXCLUDED.upper_bound,
          confidence_level = EXCLUDED.confidence_level,
          weather_effect_score = EXCLUDED.weather_effect_score,
          baseline_entries = EXCLUDED.baseline_entries,
          rider_facing_note = EXCLUDED.rider_facing_note,
          updated_at = NOW()
        """
    )

    payload = [
        {
            "station_id": item.station_id,
            "forecast_date": item.forecast_date,
            "predicted_entries": item.predicted_entries,
            "lower_bound": item.lower_bound,
            "upper_bound": item.upper_bound,
            "model_name": item.model_name,
            "model_version": item.model_version,
            "confidence_level": item.confidence_level,
            "weather_effect_score": item.weather_effect_score,
            "baseline_entries": item.baseline_entries,
            "rider_facing_note": item.rider_facing_note,
        }
        for item in records
    ]

    with engine.begin() as conn:
        conn.execute(sql, payload)

    return len(payload)
