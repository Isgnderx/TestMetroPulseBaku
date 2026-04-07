from __future__ import annotations

from datetime import datetime

BAKU_LAT_MIN = 39.5
BAKU_LAT_MAX = 41.5
BAKU_LON_MIN = 48.5
BAKU_LON_MAX = 51.5


def parse_iso_datetime(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return parsed


def parse_iso_date(value: str) -> datetime.date:
    return datetime.strptime(value, "%Y-%m-%d").date()


def is_valid_baku_coordinate(lat: float, lon: float) -> bool:
    return BAKU_LAT_MIN <= lat <= BAKU_LAT_MAX and BAKU_LON_MIN <= lon <= BAKU_LON_MAX


def parse_bool(value: str | bool | None) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    normalized = str(value).strip().lower()
    return normalized in {"1", "true", "yes", "y"}
