from __future__ import annotations

from dataclasses import dataclass
from datetime import date

import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline

from etl.forecasting.baseline import baseline_predict
from etl.forecasting.constants import CATEGORICAL_FEATURES, MODEL_NAME, MODEL_VERSION, NUMERIC_FEATURES


@dataclass(frozen=True)
class ForecastOutput:
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


def score_confidence(prediction: float, residual_std: float, recent_volatility: float) -> tuple[float, float, float]:
    spread = max(residual_std, recent_volatility * 0.75, prediction * 0.06)
    z = 1.28
    lower = max(0.0, prediction - z * spread)
    upper = max(lower, prediction + z * spread)

    ratio = spread / max(prediction, 1.0)
    confidence = float(np.clip(1.0 - ratio, 0.35, 0.95))
    return lower, upper, confidence


def compute_weather_effect_score(
    model: Pipeline,
    feature_frame: pd.DataFrame,
    neutral_temperature: float,
    neutral_humidity: float,
    neutral_wind_speed: float,
) -> float:
    actual_pred = float(np.clip(model.predict(feature_frame)[0], a_min=0.0, a_max=None))

    neutral = feature_frame.copy()
    neutral["temperature"] = neutral_temperature
    neutral["humidity"] = neutral_humidity
    neutral["precipitation"] = 0.0
    neutral["wind_speed"] = neutral_wind_speed

    neutral_pred = float(np.clip(model.predict(neutral)[0], a_min=0.0, a_max=None))
    base = max(neutral_pred, 1.0)
    return float(np.clip((actual_pred - neutral_pred) / base, -1.0, 1.0))


def make_rider_note(delta_pct: float) -> str:
    if delta_pct >= 30:
        return "Much busier than typical station-entry volume"
    if delta_pct >= 12:
        return "Busier than usual for this station"
    if delta_pct <= -20:
        return "Much quieter than typical station-entry volume"
    if delta_pct <= -10:
        return "Quieter than usual for this station"
    return "Expected station-entry demand is close to baseline"


def generate_next_day_forecasts(
    model: Pipeline,
    history_frame: pd.DataFrame,
    target_features: pd.DataFrame,
    residual_std: float,
    neutral_temperature: float,
    neutral_humidity: float,
    neutral_wind_speed: float,
) -> list[ForecastOutput]:
    outputs: list[ForecastOutput] = []

    predictors = NUMERIC_FEATURES + CATEGORICAL_FEATURES
    baseline_values = baseline_predict(target_features)
    predictions = np.clip(model.predict(target_features[predictors]), a_min=0.0, a_max=None)

    for idx, row in target_features.reset_index(drop=True).iterrows():
        station_id = str(row["station_id"])
        forecast_date = pd.Timestamp(row["date"]).date()
        prediction = float(predictions[idx])
        baseline_entry = int(round(float(baseline_values[idx])))

        station_history = history_frame[history_frame["station_id"] == station_id].copy()
        recent_std = float(station_history["entries"].tail(14).std() if not station_history.empty else 0.0)
        recent_std = 0.0 if np.isnan(recent_std) else recent_std

        lower, upper, confidence = score_confidence(prediction, residual_std, recent_std)

        one_row = target_features.iloc[[idx]][predictors]
        weather_effect = compute_weather_effect_score(
            model=model,
            feature_frame=one_row,
            neutral_temperature=neutral_temperature,
            neutral_humidity=neutral_humidity,
            neutral_wind_speed=neutral_wind_speed,
        )

        delta_pct = 0.0
        if baseline_entry > 0:
            delta_pct = ((prediction - baseline_entry) / baseline_entry) * 100.0

        outputs.append(
            ForecastOutput(
                station_id=station_id,
                forecast_date=forecast_date,
                predicted_entries=int(round(prediction)),
                baseline_entries=baseline_entry,
                lower_bound=int(round(lower)),
                upper_bound=int(round(upper)),
                confidence_level=confidence,
                weather_effect_score=weather_effect,
                model_name=MODEL_NAME,
                model_version=MODEL_VERSION,
                rider_facing_note=make_rider_note(delta_pct),
            )
        )

    return outputs


def build_next_day_feature_frame(model_frame: pd.DataFrame) -> pd.DataFrame:
    rows: list[dict[str, object]] = []

    ordered = model_frame.sort_values(["station_id", "date"]).copy()
    for station_id, station_frame in ordered.groupby("station_id"):
        station_frame = station_frame.sort_values("date").copy()
        if station_frame.empty:
            continue

        last_row = station_frame.iloc[-1]
        next_date = pd.Timestamp(last_row["date"]) + pd.Timedelta(days=1)

        recent_entries = station_frame["entries"].tail(14).to_numpy(dtype=float)
        if len(recent_entries) < 8:
            continue

        lag_1 = float(recent_entries[-1])
        lag_7 = float(recent_entries[-7])
        rolling_7 = float(np.mean(recent_entries[-7:]))
        rolling_14 = float(np.mean(recent_entries))
        rolling_std_7 = float(np.std(recent_entries[-7:]))

        rows.append(
            {
                "date": next_date,
                "station_id": station_id,
                "station_type": str(last_row["station_type"]),
                "day_of_week": int(next_date.dayofweek),
                "is_weekend": int(next_date.dayofweek >= 5),
                "month": int(next_date.month),
                "day_of_year": int(next_date.dayofyear),
                "lag_1": lag_1,
                "lag_7": lag_7,
                "rolling_avg_7": rolling_7,
                "rolling_avg_14": rolling_14,
                "rolling_std_7": rolling_std_7,
                "temperature": float(last_row["temperature"]),
                "humidity": float(last_row["humidity"]),
                "precipitation": float(last_row["precipitation"]),
                "wind_speed": float(last_row["wind_speed"]),
                "entries": lag_1,
            }
        )

    if not rows:
        return pd.DataFrame(columns=model_frame.columns)

    return pd.DataFrame(rows)
