from __future__ import annotations

import pandas as pd


def add_time_features(frame: pd.DataFrame) -> pd.DataFrame:
    df = frame.copy()
    dt = pd.to_datetime(df["date"])
    df["day_of_week"] = dt.dt.dayofweek
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)
    df["month"] = dt.dt.month
    df["day_of_year"] = dt.dt.dayofyear
    return df


def add_lag_features(frame: pd.DataFrame) -> pd.DataFrame:
    df = frame.sort_values(["station_id", "date"]).copy()
    grouped = df.groupby("station_id", group_keys=False)

    df["lag_1"] = grouped["entries"].shift(1)
    df["lag_7"] = grouped["entries"].shift(7)
    df["rolling_avg_7"] = grouped["entries"].transform(
        lambda values: values.shift(1).rolling(7, min_periods=3).mean()
    )
    df["rolling_avg_14"] = grouped["entries"].transform(
        lambda values: values.shift(1).rolling(14, min_periods=5).mean()
    )
    df["rolling_std_7"] = grouped["entries"].transform(
        lambda values: values.shift(1).rolling(7, min_periods=3).std()
    )

    return df


def build_model_frame(frame: pd.DataFrame) -> pd.DataFrame:
    with_time = add_time_features(frame)
    with_lags = add_lag_features(with_time)

    with_lags["rolling_std_7"] = with_lags["rolling_std_7"].fillna(0.0)

    needed = [
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
        "station_id",
        "station_type",
        "entries",
        "date",
    ]

    result = with_lags.dropna(subset=["lag_1", "lag_7", "rolling_avg_7", "rolling_avg_14"]).copy()
    return result[needed]
