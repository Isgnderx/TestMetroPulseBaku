from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


@dataclass(frozen=True)
class EtlConfig:
    database_url: str
    openweather_key: str | None
    weather_city: str
    weather_lat: float
    weather_lon: float
    log_level: str


def load_config() -> EtlConfig:
    root = Path(__file__).resolve().parents[2]
    load_dotenv(root / ".env.local", override=False)
    load_dotenv(root / ".env", override=False)

    database_url = os.getenv("DATABASE_URL", "").strip()
    if not database_url:
        raise EnvironmentError("DATABASE_URL is required for ETL jobs")

    lat_raw = os.getenv("BAKU_CENTER_LAT", "40.4093").strip()
    lon_raw = os.getenv("BAKU_CENTER_LON", "49.8671").strip()

    return EtlConfig(
        database_url=database_url,
        openweather_key=os.getenv("OPENWEATHER_KEY"),
        weather_city=os.getenv("WEATHER_CITY", "Baku").strip() or "Baku",
        weather_lat=float(lat_raw),
        weather_lon=float(lon_raw),
        log_level=os.getenv("ETL_LOG_LEVEL", "INFO").upper(),
    )
