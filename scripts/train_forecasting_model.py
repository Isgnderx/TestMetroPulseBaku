#!/usr/bin/env python3
"""Train XGBoost station-demand model and persist artifact."""

from __future__ import annotations

import argparse
import json
import logging
from datetime import datetime, timezone
from pathlib import Path

from etl.config import load_config
from etl.db import build_engine
from etl.forecasting.constants import CATEGORICAL_FEATURES, MODEL_NAME, MODEL_VERSION, NUMERIC_FEATURES
from etl.forecasting.dataset import load_station_daily_with_weather, time_split
from etl.forecasting.features import build_model_frame
from etl.forecasting.modeling import evaluate_model, fit_model
from etl.forecasting.persistence import save_model_artifact
from etl.logging_utils import configure_logging

LOGGER = logging.getLogger(__name__)


def main() -> None:
    parser = argparse.ArgumentParser(description="Train station-level next-day demand model")
    parser.add_argument("--station", default="all", help="Station slug or 'all'")
    parser.add_argument("--output", default="models/station_demand_xgb.joblib")
    parser.add_argument("--report", default="models/station_demand_xgb.metrics.json")
    args = parser.parse_args()

    config = load_config()
    configure_logging(config.log_level)

    station_slug = None if args.station == "all" else args.station

    engine = build_engine(config.database_url)
    raw_frame = load_station_daily_with_weather(engine, station_slug=station_slug)
    if raw_frame.empty:
        raise RuntimeError("No station-demand rows found for training")

    model_frame = build_model_frame(raw_frame)
    if model_frame.empty:
        raise RuntimeError("Insufficient history after lag feature engineering")

    train_frame, valid_frame = time_split(model_frame, validation_ratio=0.2)

    model = fit_model(train_frame)
    eval_result = evaluate_model(model, valid_frame)

    neutral_weather = {
        "temperature": float(model_frame["temperature"].median()),
        "humidity": float(model_frame["humidity"].median()),
        "wind_speed": float(model_frame["wind_speed"].median()),
    }

    metadata = {
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "model_name": MODEL_NAME,
        "model_version": MODEL_VERSION,
        "station_scope": args.station,
        "features": NUMERIC_FEATURES + CATEGORICAL_FEATURES,
        "rows_train": int(len(train_frame)),
        "rows_validation": int(len(valid_frame)),
        "metrics": {
            "baseline_mae": eval_result.baseline_mae,
            "baseline_mape": eval_result.baseline_mape,
            "xgb_mae": eval_result.xgb_mae,
            "xgb_mape": eval_result.xgb_mape,
        },
        "residual_std": eval_result.residual_std,
        "neutral_weather": neutral_weather,
    }

    output_path = Path(args.output)
    report_path = Path(args.report)

    save_model_artifact(output_path, model, metadata)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    LOGGER.info("Model saved to %s", output_path)
    LOGGER.info("Metrics report saved to %s", report_path)
    LOGGER.info(
        "Validation MAE baseline=%.2f | xgb=%.2f",
        eval_result.baseline_mae,
        eval_result.xgb_mae,
    )
    LOGGER.info(
        "Validation MAPE baseline=%.2f%% | xgb=%.2f%%",
        eval_result.baseline_mape,
        eval_result.xgb_mape,
    )


if __name__ == "__main__":
    main()
