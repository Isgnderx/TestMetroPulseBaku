from __future__ import annotations

import logging
from pathlib import Path

import pandas as pd

from etl.config import EtlConfig
from etl.db import ExitRecord, build_engine, fetch_station_references, upsert_station_exits
from etl.normalization import StationNormalizer
from etl.validators import is_valid_baku_coordinate, parse_bool

LOGGER = logging.getLogger(__name__)


def run_exits_job(csv_path: Path, config: EtlConfig, dry_run: bool = False) -> int:
    if not csv_path.exists():
        raise FileNotFoundError(f"Exits CSV does not exist: {csv_path}")

    engine = build_engine(config.database_url)
    refs = fetch_station_references(engine)
    normalizer = StationNormalizer(refs)

    frame = pd.read_csv(csv_path)
    required = {"station_name", "exit_no", "lat", "lon"}
    missing = required - set(frame.columns)
    if missing:
        raise ValueError(f"Exits CSV missing required columns: {sorted(missing)}")

    frame["station_name"] = frame["station_name"].astype(str).str.strip()
    frame["exit_no"] = pd.to_numeric(frame["exit_no"], errors="coerce")
    frame["lat"] = pd.to_numeric(frame["lat"], errors="coerce")
    frame["lon"] = pd.to_numeric(frame["lon"], errors="coerce")
    frame = frame.dropna(subset=["station_name", "exit_no", "lat", "lon"])

    frame["station_id"] = frame["station_name"].apply(normalizer.resolve_station_id)
    unresolved = sorted(set(frame.loc[frame["station_id"].isna(), "station_name"].tolist()))
    if unresolved:
        LOGGER.warning("Unresolved station names (%d): %s", len(unresolved), unresolved)

    frame = frame.dropna(subset=["station_id"]).copy()

    records_map: dict[tuple[str, int], ExitRecord] = {}
    for row in frame.itertuples(index=False):
        lat = float(row.lat)
        lon = float(row.lon)
        if not is_valid_baku_coordinate(lat, lon):
            LOGGER.warning("Skipping exit outside Baku bounds: station=%s exit=%s", row.station_name, row.exit_no)
            continue

        station_id = str(row.station_id)
        exit_no = int(row.exit_no)
        key = (station_id, exit_no)

        exit_label = getattr(row, "exit_label", None)
        address_text = getattr(row, "address_text", None)
        accessible = parse_bool(getattr(row, "is_accessible", None))

        record = ExitRecord(
            id=f"ex-{station_id.replace('st-', '')}-{exit_no}",
            station_id=station_id,
            exit_no=exit_no,
            exit_label=str(exit_label).strip() if exit_label and str(exit_label).strip() else f"Exit {exit_no}",
            address_text=str(address_text).strip() if address_text and str(address_text).strip() else "",
            lat=lat,
            lon=lon,
            is_accessible=accessible,
        )
        records_map[key] = record

    records = list(records_map.values())
    LOGGER.info("Exit rows after validation/dedup: %d", len(records))

    if dry_run:
        LOGGER.info("Dry run enabled; no DB writes for exits")
        return len(records)

    inserted = upsert_station_exits(engine, records)
    LOGGER.info("Upserted station exits rows: %d", inserted)
    return inserted
