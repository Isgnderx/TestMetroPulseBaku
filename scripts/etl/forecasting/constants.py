from __future__ import annotations

TARGET_COLUMN = "entries"
DATE_COLUMN = "date"
STATION_ID_COLUMN = "station_id"
STATION_TYPE_COLUMN = "station_type"

NUMERIC_FEATURES = [
    "day_of_week",
    "is_weekend",
    "month",
    "day_of_year",
    "lag_1",
    "lag_7",
    "rolling_avg_7",
    "rolling_avg_14",
    "rolling_std_7",
    "temperature",
    "humidity",
    "precipitation",
    "wind_speed",
]

CATEGORICAL_FEATURES = [
    STATION_ID_COLUMN,
    STATION_TYPE_COLUMN,
]

MODEL_NAME = "xgboost-station-demand"
MODEL_VERSION = "2.0.0"
