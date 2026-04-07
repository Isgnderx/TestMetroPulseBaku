from __future__ import annotations

import logging
from pathlib import Path

import pandas as pd
import requests

from etl.config import EtlConfig
from etl.db import WeatherRecord, build_engine, upsert_weather_city_center
from etl.validators import parse_iso_datetime

LOGGER = logging.getLogger(__name__)


def run_weather_csv_job(csv_path: Path, config: EtlConfig, dry_run: bool = False) -> int:
    if not csv_path.exists():
        raise FileNotFoundError(f"Weather CSV does not exist: {csv_path}")

    frame = pd.read_csv(csv_path)
    required = {"observed_at", "temp_c", "feels_like_c", "humidity", "wind_speed", "precipitation", "pressure", "condition"}
    missing = required - set(frame.columns)
    if missing:
        raise ValueError(f"Weather CSV missing required columns: {sorted(missing)}")

    records = _records_from_frame(frame)
    return _write_records(records, config, dry_run)


def run_weather_api_job(config: EtlConfig, dry_run: bool = False) -> int:
    if not config.openweather_key:
        raise EnvironmentError("OPENWEATHER_KEY is required for weather API ingestion")

    url = "https://api.openweathermap.org/data/2.5/forecast"
    params = {
        "lat": config.weather_lat,
        "lon": config.weather_lon,
        "appid": config.openweather_key,
        "units": "metric",
        "cnt": 40,
    }

    response = requests.get(url, params=params, timeout=20)
    response.raise_for_status()
    payload = response.json()

    rows: list[dict[str, object]] = []
    for item in payload.get("list", []):
        rows.append(
            {
                "observed_at": pd.to_datetime(item["dt"], unit="s", utc=True).isoformat(),
                "temp_c": item.get("main", {}).get("temp", 0),
                "feels_like_c": item.get("main", {}).get("feels_like", 0),
                "humidity": item.get("main", {}).get("humidity", 0),
                "wind_speed": float(item.get("wind", {}).get("speed", 0)) * 3.6,
                "precipitation": item.get("rain", {}).get("3h", 0) or 0,
                "pressure": item.get("main", {}).get("pressure", 0),
                "condition": _normalize_condition_id(int(item.get("weather", [{}])[0].get("id", 803))),
            }
        )

    frame = pd.DataFrame(rows)
    records = _records_from_frame(frame)
    return _write_records(records, config, dry_run)


def _records_from_frame(frame: pd.DataFrame) -> list[WeatherRecord]:
    frame = frame.copy()

    frame["temp_c"] = pd.to_numeric(frame["temp_c"], errors="coerce")
    frame["feels_like_c"] = pd.to_numeric(frame["feels_like_c"], errors="coerce")
    frame["humidity"] = pd.to_numeric(frame["humidity"], errors="coerce")
    frame["wind_speed"] = pd.to_numeric(frame["wind_speed"], errors="coerce")
    frame["precipitation"] = pd.to_numeric(frame["precipitation"], errors="coerce")
    frame["pressure"] = pd.to_numeric(frame["pressure"], errors="coerce")

    frame = frame.dropna(
        subset=[
            "observed_at",
            "temp_c",
            "feels_like_c",
            "humidity",
            "wind_speed",
            "precipitation",
            "pressure",
            "condition",
        ]
    )

    records_map: dict[str, WeatherRecord] = {}
    for row in frame.itertuples(index=False):
        observed = parse_iso_datetime(str(row.observed_at))
        condition = _normalize_condition_text(str(row.condition))

        records_map[observed.isoformat()] = WeatherRecord(
            observed_at=observed,
            temp_c=float(row.temp_c),
            feels_like_c=float(row.feels_like_c),
            humidity=float(row.humidity),
            wind_speed=float(row.wind_speed),
            precipitation=float(row.precipitation),
            pressure=float(row.pressure),
            condition=condition,
        )

    records = list(records_map.values())
    LOGGER.info("Weather rows after validation/dedup: %d", len(records))
    return records


def _write_records(records: list[WeatherRecord], config: EtlConfig, dry_run: bool) -> int:
    if dry_run:
        LOGGER.info("Dry run enabled; no DB writes for weather")
        return len(records)

    engine = build_engine(config.database_url)
    inserted = upsert_weather_city_center(engine, records)
    LOGGER.info("Upserted weather rows: %d", inserted)
    return inserted


def _normalize_condition_text(condition: str) -> str:
    normalized = condition.strip().lower().replace(" ", "_")
    allowed = {
        "clear",
        "partly_cloudy",
        "cloudy",
        "rain",
        "heavy_rain",
        "fog",
        "snow",
        "wind",
        "storm",
    }
    return normalized if normalized in allowed else "cloudy"


def _normalize_condition_id(condition_id: int) -> str:
    if 200 <= condition_id <= 232:
        return "storm"
    if 300 <= condition_id <= 321:
        return "rain"
    if 500 <= condition_id <= 504:
        return "rain"
    if 511 <= condition_id <= 531:
        return "heavy_rain"
    if 600 <= condition_id <= 622:
        return "snow"
    if 700 <= condition_id <= 781:
        return "fog"
    if condition_id == 800:
        return "clear"
    if 801 <= condition_id <= 802:
        return "partly_cloudy"
    return "cloudy"
