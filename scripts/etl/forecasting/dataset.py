from __future__ import annotations

import pandas as pd
from sqlalchemy import text
from sqlalchemy.engine import Engine


def load_station_daily_with_weather(engine: Engine, station_slug: str | None = None) -> pd.DataFrame:
    sql = text(
        """
        WITH weather_daily AS (
          SELECT
            DATE(observed_at) AS weather_date,
            AVG(temp_c) AS temperature,
            AVG(humidity) AS humidity,
            SUM(precipitation) AS precipitation,
            AVG(wind_speed) AS wind_speed
          FROM public.weather_city_center
          GROUP BY 1
        )
        SELECT
          d.date,
          d.station_id,
          s.slug,
          COALESCE(s.station_type, 'mixed') AS station_type,
          d.entries,
          COALESCE(w.temperature, 15.0) AS temperature,
          COALESCE(w.humidity, 60.0) AS humidity,
          COALESCE(w.precipitation, 0.0) AS precipitation,
          COALESCE(w.wind_speed, 10.0) AS wind_speed
        FROM public.station_daily_demand d
        INNER JOIN public.stations s ON s.id = d.station_id
        LEFT JOIN weather_daily w ON w.weather_date = d.date
        WHERE (:station_slug IS NULL OR s.slug = :station_slug)
        ORDER BY d.station_id, d.date
        """
    )

    frame = pd.read_sql_query(sql, engine, params={"station_slug": station_slug})
    if frame.empty:
        return frame

    frame["date"] = pd.to_datetime(frame["date"])
    frame["entries"] = pd.to_numeric(frame["entries"], errors="coerce")
    frame = frame.dropna(subset=["entries"])
    frame["entries"] = frame["entries"].astype(float)

    for col in ["temperature", "humidity", "precipitation", "wind_speed"]:
        frame[col] = pd.to_numeric(frame[col], errors="coerce").fillna(0.0)

    return frame


def time_split(frame: pd.DataFrame, validation_ratio: float = 0.2) -> tuple[pd.DataFrame, pd.DataFrame]:
    ordered = frame.sort_values("date").copy()
    unique_dates = ordered["date"].drop_duplicates().sort_values().tolist()
    split_index = max(int(len(unique_dates) * (1 - validation_ratio)), 1)
    cutoff = unique_dates[split_index - 1]

    train = ordered[ordered["date"] <= cutoff].copy()
    valid = ordered[ordered["date"] > cutoff].copy()

    if valid.empty:
        valid = train.tail(max(len(train) // 5, 1)).copy()
        train = train.iloc[: max(len(train) - len(valid), 1)].copy()

    return train, valid
