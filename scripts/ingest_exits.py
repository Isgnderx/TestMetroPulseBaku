#!/usr/bin/env python3
"""CLI wrapper for station exits ingestion."""

from __future__ import annotations

import argparse
import logging
from pathlib import Path

from etl.config import load_config
from etl.jobs.exits_job import run_exits_job
from etl.logging_utils import configure_logging

LOGGER = logging.getLogger(__name__)


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest station exits CSV")
    parser.add_argument("--file", required=True, help="CSV with station_name, exit_no, lat, lon")
    parser.add_argument("--dry-run", action="store_true", help="Validate and normalize without DB writes")
    args = parser.parse_args()

    config = load_config()
    configure_logging(config.log_level)

    inserted = run_exits_job(
        csv_path=Path(args.file),
        config=config,
        dry_run=args.dry_run,
    )
    LOGGER.info("Exits job completed. Rows prepared/upserted: %d", inserted)


if __name__ == "__main__":
    main()
