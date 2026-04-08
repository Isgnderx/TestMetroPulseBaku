#!/usr/bin/env python3
"""Backfill historical Baku weather into weather_city_center using Open-Meteo."""

from __future__ import annotations

import argparse
import logging
from datetime import date, datetime, timedelta
from typing import Iterable

import requests
from sqlalchemy import text

from etl.config import load_config
from etl.db import WeatherRecord, build_engine, upsert_weather_city_center
from etl.logging_utils import configure_logging

LOGGER = logging.getLogger(__name__)
ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
CHUNK_DAYS = 90


def chunk_dates(start_date: date, end_date: date) -> Iterable[tuple[date, date]]:
    current = start_date
    while current <= end_date:
        chunk_end = min(current + timedelta(days=CHUNK_DAYS - 1), end_date)
        yield current, chunk_end
        current = chunk_end + timedelta(days=1)


def map_weather_code(code: int | None) -> str:
    if code == 0:
        return "clear"
    if code in {1, 2}:
        return "partly_cloudy"
    if code == 3:
        return "cloudy"
    if code in {45, 48}:
        return "fog"
    if code in {51, 53, 55, 56, 57, 61, 63, 65, 66, 67}:
        return "rain"
    if code in {71, 73, 75, 77, 85, 86}:
        return "snow"
    if code in {80, 81, 82}:
        return "heavy_rain"
    if code in {95, 96, 99}:
        return "storm"
    return "cloudy"


def coerce_float(value: object, fallback: float = 0.0) -> float:
    if value is None:
        return fallback
    return float(value)


def fetch_range(lat: float, lon: float, start_date: date, end_date: date) -> list[WeatherRecord]:
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "hourly": ",".join(
            [
                "temperature_2m",
                "apparent_temperature",
                "relative_humidity_2m",
                "precipitation",
                "pressure_msl",
                "wind_speed_10m",
                "weather_code",
            ]
        ),
        "timezone": "Asia/Baku",
    }

    response = requests.get(ARCHIVE_URL, params=params, timeout=60)
    response.raise_for_status()
    payload = response.json()
    hourly = payload.get("hourly", {})

    times = hourly.get("time", [])
    records: list[WeatherRecord] = []
    for index, observed_at in enumerate(times):
        records.append(
            WeatherRecord(
                observed_at=datetime.fromisoformat(f"{observed_at}+04:00"),
                temp_c=coerce_float(hourly.get("temperature_2m", [None])[index]),
                feels_like_c=coerce_float(hourly.get("apparent_temperature", [None])[index]),
                humidity=coerce_float(hourly.get("relative_humidity_2m", [None])[index]),
                wind_speed=coerce_float(hourly.get("wind_speed_10m", [None])[index]),
                precipitation=coerce_float(hourly.get("precipitation", [None])[index]),
                pressure=coerce_float(hourly.get("pressure_msl", [None])[index]),
                condition=map_weather_code(hourly.get("weather_code", [None])[index]),
            )
        )
    return records


def resolve_date_range(engine, start_arg: str | None, end_arg: str | None) -> tuple[date, date]:
    if start_arg and end_arg:
        return date.fromisoformat(start_arg), date.fromisoformat(end_arg)

    sql = text("SELECT MIN(date) AS min_date, MAX(date) AS max_date FROM public.station_daily_demand")
    with engine.begin() as conn:
        row = conn.execute(sql).mappings().one()

    if not row["min_date"] or not row["max_date"]:
        raise RuntimeError("station_daily_demand is empty; provide --start-date and --end-date explicitly")

    start_date = date.fromisoformat(start_arg) if start_arg else row["min_date"]
    end_date = date.fromisoformat(end_arg) if end_arg else row["max_date"]
    return start_date, end_date


def main() -> None:
    parser = argparse.ArgumentParser(description="Backfill weather_city_center from Open-Meteo archive")
    parser.add_argument("--start-date", help="YYYY-MM-DD")
    parser.add_argument("--end-date", help="YYYY-MM-DD")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    config = load_config()
    configure_logging(config.log_level)

    engine = build_engine(config.database_url)
    start_date, end_date = resolve_date_range(engine, args.start_date, args.end_date)
    LOGGER.info("Backfilling weather archive from %s to %s", start_date, end_date)

    prepared = 0
    written = 0
    for chunk_start, chunk_end in chunk_dates(start_date, end_date):
        records = fetch_range(config.weather_lat, config.weather_lon, chunk_start, chunk_end)
        prepared += len(records)
        LOGGER.info("Fetched %d weather rows for %s to %s", len(records), chunk_start, chunk_end)
        if args.dry_run:
            continue
        written += upsert_weather_city_center(engine, records)

    LOGGER.info("Weather archive rows prepared: %d", prepared)
    if not args.dry_run:
        LOGGER.info("Weather archive rows upserted: %d", written)


if __name__ == "__main__":
    main()
