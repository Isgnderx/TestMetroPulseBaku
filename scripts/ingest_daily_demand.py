#!/usr/bin/env python3
"""CLI wrapper for daily station-entry demand ingestion."""

from __future__ import annotations

import argparse
import logging
from pathlib import Path

from etl.config import load_config
from etl.jobs.daily_demand_job import run_daily_demand_job
from etl.logging_utils import configure_logging

LOGGER = logging.getLogger(__name__)


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest daily station-entry demand CSV")
    parser.add_argument("--file", required=True, help="CSV with date, station_name, entries")
    parser.add_argument("--year", type=int, required=True, help="Source year for ingested rows")
    parser.add_argument("--dry-run", action="store_true", help="Validate and normalize without DB writes")
    args = parser.parse_args()

    config = load_config()
    configure_logging(config.log_level)

    inserted = run_daily_demand_job(
        csv_path=Path(args.file),
        source_year=args.year,
        config=config,
        dry_run=args.dry_run,
    )
    LOGGER.info("Daily demand job completed. Rows prepared/upserted: %d", inserted)


if __name__ == "__main__":
    main()
