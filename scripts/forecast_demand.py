#!/usr/bin/env python3
"""Backward-compatible wrapper for next-day forecast generation."""

from __future__ import annotations

import argparse
import logging
from pathlib import Path

from etl.config import load_config
from etl.db import ForecastWriteRecord, build_engine, upsert_station_forecasts
from etl.forecasting.dataset import load_station_daily_with_weather
from etl.forecasting.features import build_model_frame
from etl.forecasting.inference import build_next_day_feature_frame, generate_next_day_forecasts
from etl.forecasting.persistence import load_model_artifact
from etl.logging_utils import configure_logging

LOGGER = logging.getLogger(__name__)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate next-day station demand forecast rows")
    parser.add_argument("--station", default="all", help="Station slug or 'all'")
    parser.add_argument("--horizon", type=int, default=1, help="Reserved; currently next-day only")
    parser.add_argument("--model", default="models/station_demand_xgb.joblib")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    config = load_config()
    configure_logging(config.log_level)

    if args.horizon != 1:
        LOGGER.warning("Only next-day forecasting is currently supported; ignoring --horizon=%s", args.horizon)

    model, metadata = load_model_artifact(Path(args.model))
    residual_std = float(metadata.get("residual_std", 0.0))
    neutral_weather = metadata.get("neutral_weather", {})

    engine = build_engine(config.database_url)
    station_slug = None if args.station == "all" else args.station
    raw_frame = load_station_daily_with_weather(engine, station_slug=station_slug)

    if raw_frame.empty:
        raise RuntimeError("No daily station-entry rows available for forecasting")

    model_frame = build_model_frame(raw_frame)
    target_frame = build_next_day_feature_frame(model_frame)

    outputs = generate_next_day_forecasts(
        model=model,
        history_frame=model_frame,
        target_features=target_frame,
        residual_std=residual_std,
        neutral_temperature=float(neutral_weather.get("temperature", 15.0)),
        neutral_humidity=float(neutral_weather.get("humidity", 60.0)),
        neutral_wind_speed=float(neutral_weather.get("wind_speed", 10.0)),
    )

    records = [
        ForecastWriteRecord(
            station_id=item.station_id,
            forecast_date=item.forecast_date,
            predicted_entries=item.predicted_entries,
            baseline_entries=item.baseline_entries,
            lower_bound=item.lower_bound,
            upper_bound=item.upper_bound,
            confidence_level=item.confidence_level,
            weather_effect_score=item.weather_effect_score,
            model_name=item.model_name,
            model_version=item.model_version,
            rider_facing_note=item.rider_facing_note,
        )
        for item in outputs
    ]

    if args.dry_run:
        LOGGER.info("Dry run enabled; generated %d rows", len(records))
        return

    written = upsert_station_forecasts(engine, records)
    LOGGER.info("Upserted %d forecast rows", written)


if __name__ == "__main__":
    main()
