#!/usr/bin/env python3
"""Resolve raw station names into canonical station slugs/IDs."""

from __future__ import annotations

import argparse
import logging

from etl.config import load_config
from etl.db import build_engine, fetch_station_references
from etl.logging_utils import configure_logging
from etl.normalization import KNOWN_ALIASES, StationNormalizer, StationReference, normalize_text, slugify_station

LOGGER = logging.getLogger(__name__)


def main() -> None:
    parser = argparse.ArgumentParser(description="Normalize station names using DB canonical records")
    parser.add_argument("--name", required=True, help="Raw station name to normalize")
    args = parser.parse_args()

    refs: list[StationReference]
    try:
        config = load_config()
        configure_logging(config.log_level)
        engine = build_engine(config.database_url)
        refs = fetch_station_references(engine)
    except Exception as error:
        configure_logging("INFO")
        LOGGER.warning(
            "DATABASE_URL not available or DB unreachable. Falling back to alias-only normalization. (%s)",
            error,
        )
        unique_slugs = sorted(set(KNOWN_ALIASES.values()))
        refs = [
            StationReference(
                id=f"fallback-{slug}",
                slug=slug,
                name=slug.replace("-", " ").title(),
                name_az=slug.replace("-", " ").title(),
            )
            for slug in unique_slugs
        ]

    normalizer = StationNormalizer(refs)

    slug = normalizer.resolve_slug(args.name)
    station_id = normalizer.resolve_station_id(args.name)

    print(f"raw: {args.name}")
    print(f"normalized_text: {normalize_text(args.name)}")
    print(f"auto_slug: {slugify_station(args.name)}")
    print(f"resolved_slug: {slug}")
    print(f"resolved_station_id: {station_id}")

    if slug is None:
        LOGGER.warning("No station mapping found for input name")


if __name__ == "__main__":
    main()
