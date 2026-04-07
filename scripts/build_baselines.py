#!/usr/bin/env python3
"""
MetroPulse Baku - Baseline Builder
Computes rolling averages and day-of-week baselines from historical demand data.
Writes results to station_baselines table.

Usage:
  python build_baselines.py [--station all] [--dry-run]
"""

import argparse
import logging
import os
import sys
from collections import defaultdict
from datetime import date, timedelta
from statistics import mean, median
from typing import Optional

import psycopg2
from psycopg2.extras import execute_batch, RealDictCursor

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger(__name__)


def get_connection():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        raise EnvironmentError("DATABASE_URL is not set")
    return psycopg2.connect(db_url, cursor_factory=RealDictCursor)


def fetch_history(conn, station_id: str, lookback: int = 90) -> list[dict]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT date, entries FROM station_daily_demand
            WHERE station_id = %s
              AND date >= CURRENT_DATE - INTERVAL '%s days'
            ORDER BY date ASC
            """,
            (station_id, lookback),
        )
        return [dict(r) for r in cur.fetchall()]


def compute_baselines(history: list[dict]) -> list[dict]:
    """Compute per-DOW baselines and rolling averages."""
    by_dow: dict[int, list[int]] = defaultdict(list)
    by_date: dict[date, int] = {}

    for row in history:
        d = row["date"]
        e = int(row["entries"])
        by_dow[d.weekday()].append(e)
        by_date[d] = e

    results = []
    all_dates = sorted(by_date.keys())

    for dow in range(7):
        values = by_dow[dow]
        if not values:
            continue

        avg = mean(values)
        med = median(values)

        # Rolling 7-day avg (use all dates, not just this DOW)
        recent_7 = [by_date[d] for d in all_dates[-7:] if d in by_date]
        recent_30 = [by_date[d] for d in all_dates[-30:] if d in by_date]
        rolling_7 = mean(recent_7) if recent_7 else avg
        rolling_30 = mean(recent_30) if recent_30 else avg

        results.append({
            "dow": dow,
            "avg_entries": round(avg, 1),
            "median_entries": round(med, 1),
            "rolling_avg_7": round(rolling_7, 1),
            "rolling_avg_30": round(rolling_30, 1),
        })

    return results


def fetch_stations(conn, slug_filter: Optional[str] = None) -> list[dict]:
    with conn.cursor() as cur:
        if slug_filter and slug_filter != "all":
            cur.execute("SELECT id, slug, name FROM stations WHERE slug = %s", (slug_filter,))
        else:
            cur.execute("SELECT id, slug, name FROM stations ORDER BY name")
        return [dict(r) for r in cur.fetchall()]


def run(station_slug: str, dry_run: bool) -> None:
    conn = get_connection()
    stations = fetch_stations(conn, station_slug)

    if not stations:
        log.error(f"No stations found for: {station_slug}")
        sys.exit(1)

    log.info(f"Building baselines for {len(stations)} stations")
    all_rows = []

    for s in stations:
        history = fetch_history(conn, s["id"])
        if len(history) < 7:
            log.warning(f"{s['name']}: fewer than 7 days of history — skipping")
            continue

        baselines = compute_baselines(history)
        for b in baselines:
            all_rows.append((
                s["id"],
                b["dow"],
                b["avg_entries"],
                b["median_entries"],
                b["rolling_avg_7"],
                b["rolling_avg_30"],
            ))
        log.info(f"  {s['name']}: {len(baselines)} DOW baselines computed")

    log.info(f"Total baseline rows: {len(all_rows)}")

    if dry_run:
        log.info("Dry run — not writing to DB")
        conn.close()
        return

    with conn:
        with conn.cursor() as cur:
            execute_batch(
                cur,
                """
                INSERT INTO station_baselines
                  (station_id, dow, avg_entries, median_entries, rolling_avg_7, rolling_avg_30)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (station_id, dow) DO UPDATE SET
                  avg_entries    = EXCLUDED.avg_entries,
                  median_entries = EXCLUDED.median_entries,
                  rolling_avg_7  = EXCLUDED.rolling_avg_7,
                  rolling_avg_30 = EXCLUDED.rolling_avg_30,
                  updated_at     = NOW()
                """,
                all_rows,
                page_size=200,
            )
    log.info(f"Upserted {len(all_rows)} baseline rows")
    conn.close()


def main():
    parser = argparse.ArgumentParser(description="Build station demand baselines")
    parser.add_argument("--station", default="all")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    run(args.station, args.dry_run)


if __name__ == "__main__":
    main()
