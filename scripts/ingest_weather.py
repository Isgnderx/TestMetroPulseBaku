#!/usr/bin/env python3
"""CLI wrapper for weather ingestion from CSV or API."""

from __future__ import annotations

import argparse
import logging
from pathlib import Path

from etl.config import load_config
from etl.jobs.weather_job import run_weather_api_job, run_weather_csv_job
from etl.logging_utils import configure_logging

LOGGER = logging.getLogger(__name__)


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest weather snapshots into weather_city_center")
    parser.add_argument("--source", choices=["csv", "api"], required=True)
    parser.add_argument("--file", help="CSV path when --source csv")
    parser.add_argument("--dry-run", action="store_true", help="Validate without DB writes")
    args = parser.parse_args()

    config = load_config()
    configure_logging(config.log_level)

    if args.source == "csv":
        if not args.file:
            raise ValueError("--file is required when --source csv")
        inserted = run_weather_csv_job(Path(args.file), config=config, dry_run=args.dry_run)
    else:
        inserted = run_weather_api_job(config=config, dry_run=args.dry_run)

    LOGGER.info("Weather job completed. Rows prepared/upserted: %d", inserted)


if __name__ == "__main__":
    main()
