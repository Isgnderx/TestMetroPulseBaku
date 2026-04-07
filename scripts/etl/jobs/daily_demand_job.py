from __future__ import annotations

import logging
from pathlib import Path

import pandas as pd

from etl.config import EtlConfig
from etl.db import DailyDemandRecord, build_engine, fetch_station_references, upsert_station_daily_demand
from etl.normalization import StationNormalizer
from etl.validators import parse_iso_date

LOGGER = logging.getLogger(__name__)


def run_daily_demand_job(csv_path: Path, source_year: int, config: EtlConfig, dry_run: bool = False) -> int:
    if not csv_path.exists():
        raise FileNotFoundError(f"Demand CSV does not exist: {csv_path}")

    engine = build_engine(config.database_url)
    refs = fetch_station_references(engine)
    normalizer = StationNormalizer(refs)

    frame = pd.read_csv(csv_path)
    required = {"date", "station_name", "entries"}
    missing = required - set(frame.columns)
    if missing:
        raise ValueError(f"Demand CSV missing required columns: {sorted(missing)}")

    frame["station_name"] = frame["station_name"].astype(str).str.strip()
    frame["entries"] = pd.to_numeric(frame["entries"], errors="coerce")
    frame = frame.dropna(subset=["date", "station_name", "entries"])
    frame = frame[frame["entries"] >= 0]

    frame["station_id"] = frame["station_name"].apply(normalizer.resolve_station_id)
    unresolved = sorted(set(frame.loc[frame["station_id"].isna(), "station_name"].tolist()))
    if unresolved:
        LOGGER.warning("Unresolved station names (%d): %s", len(unresolved), unresolved)

    frame = frame.dropna(subset=["station_id"]).copy()
    frame["date"] = frame["date"].astype(str)

    records_map: dict[tuple[str, str], DailyDemandRecord] = {}
    for row in frame.itertuples(index=False):
        key = (row.date, row.station_id)
        record = DailyDemandRecord(
            date=parse_iso_date(row.date),
            station_id=str(row.station_id),
            entries=int(row.entries),
            source_year=int(source_year),
        )
        records_map[key] = record

    records = list(records_map.values())
    LOGGER.info("Daily demand rows after validation/dedup: %d", len(records))

    if dry_run:
        LOGGER.info("Dry run enabled; no DB writes for daily demand")
        return len(records)

    inserted = upsert_station_daily_demand(engine, records)
    LOGGER.info("Upserted daily demand rows: %d", inserted)
    return inserted
