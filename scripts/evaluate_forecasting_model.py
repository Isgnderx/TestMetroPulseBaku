#!/usr/bin/env python3
"""Evaluate persisted forecasting model against latest holdout window."""

from __future__ import annotations

import argparse
import json
import logging
from pathlib import Path

from etl.config import load_config
from etl.db import build_engine
from etl.forecasting.dataset import load_station_daily_with_weather
from etl.forecasting.features import build_model_frame
from etl.forecasting.modeling import evaluate_model
from etl.forecasting.persistence import load_model_artifact
from etl.logging_utils import configure_logging

LOGGER = logging.getLogger(__name__)


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate trained station-demand model")
    parser.add_argument("--model", default="models/station_demand_xgb.joblib")
    parser.add_argument("--station", default="all", help="Station slug or 'all'")
    parser.add_argument("--holdout-days", type=int, default=30)
    parser.add_argument("--report", default="models/station_demand_xgb.eval.json")
    args = parser.parse_args()

    config = load_config()
    configure_logging(config.log_level)

    model, metadata = load_model_artifact(Path(args.model))

    station_slug = None if args.station == "all" else args.station
    engine = build_engine(config.database_url)
    raw_frame = load_station_daily_with_weather(engine, station_slug=station_slug)
    model_frame = build_model_frame(raw_frame)

    if model_frame.empty:
        raise RuntimeError("No rows available for evaluation")

    ordered = model_frame.sort_values("date")
    unique_dates = ordered["date"].drop_duplicates().sort_values()
    holdout_start = unique_dates.iloc[max(len(unique_dates) - max(args.holdout_days, 1), 0)]
    holdout = ordered[ordered["date"] >= holdout_start].copy()

    result = evaluate_model(model, holdout)

    payload = {
        "model_name": metadata.get("model_name"),
        "model_version": metadata.get("model_version"),
        "station_scope": args.station,
        "rows_evaluated": int(len(holdout)),
        "metrics": {
            "baseline_mae": result.baseline_mae,
            "baseline_mape": result.baseline_mape,
            "xgb_mae": result.xgb_mae,
            "xgb_mape": result.xgb_mape,
            "residual_std": result.residual_std,
        },
    }

    report_path = Path(args.report)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    LOGGER.info("Evaluation report written to %s", report_path)
    LOGGER.info(
        "Holdout MAE baseline=%.2f | xgb=%.2f",
        result.baseline_mae,
        result.xgb_mae,
    )
    LOGGER.info(
        "Holdout MAPE baseline=%.2f%% | xgb=%.2f%%",
        result.baseline_mape,
        result.xgb_mape,
    )


if __name__ == "__main__":
    main()
