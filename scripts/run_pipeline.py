#!/usr/bin/env python3
"""Run MetroPulse ETL jobs in a production-friendly order."""

from __future__ import annotations

import argparse
import logging
from pathlib import Path

from etl.config import load_config
from etl.jobs.daily_demand_job import run_daily_demand_job
from etl.jobs.exits_job import run_exits_job
from etl.jobs.weather_job import run_weather_api_job, run_weather_csv_job
from etl.logging_utils import configure_logging

LOGGER = logging.getLogger(__name__)


def main() -> None:
    parser = argparse.ArgumentParser(description="MetroPulse Baku ETL pipeline runner")
    parser.add_argument("--demand-file", help="CSV path for station daily demand ingestion")
    parser.add_argument("--demand-year", type=int, default=2025)
    parser.add_argument("--exits-file", help="CSV path for station exits ingestion")
    parser.add_argument("--skip-weather", action="store_true")
    parser.add_argument("--weather-source", choices=["api", "csv"], default="api")
    parser.add_argument("--weather-file", help="CSV path when weather-source=csv")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    config = load_config()
    configure_logging(config.log_level)

    LOGGER.info("Starting ETL pipeline")

    if args.demand_file:
        run_daily_demand_job(
            csv_path=Path(args.demand_file),
            source_year=args.demand_year,
            config=config,
            dry_run=args.dry_run,
        )
    else:
        LOGGER.info("Skipping daily demand ingestion (no --demand-file)")

    if args.exits_file:
        run_exits_job(
            csv_path=Path(args.exits_file),
            config=config,
            dry_run=args.dry_run,
        )
    else:
        LOGGER.info("Skipping exits ingestion (no --exits-file)")

    if not args.skip_weather:
        if args.weather_source == "csv":
            if not args.weather_file:
                raise ValueError("--weather-file is required when --weather-source csv")
            run_weather_csv_job(Path(args.weather_file), config=config, dry_run=args.dry_run)
        else:
            run_weather_api_job(config=config, dry_run=args.dry_run)
    else:
        LOGGER.info("Skipping weather ingestion (--skip-weather enabled)")

    LOGGER.info("ETL pipeline completed")


if __name__ == "__main__":
    main()
