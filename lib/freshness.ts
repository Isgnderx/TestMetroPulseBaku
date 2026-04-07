export type FreshnessInfo = {
    sourceTimestamp: string | null;
    freshnessSeconds: number | null;
    freshnessLabel: string;
};

function pluralize(value: number, unit: string): string {
    return `${value} ${unit}${value === 1 ? "" : "s"} ago`;
}

function toFreshnessLabel(seconds: number): string {
    if (seconds < 60) return `Updated ${pluralize(seconds, "sec")}`;
    if (seconds < 3600) return `Updated ${pluralize(Math.floor(seconds / 60), "min")}`;
    if (seconds < 86400) return `Updated ${pluralize(Math.floor(seconds / 3600), "hour")}`;
    return `Updated ${pluralize(Math.floor(seconds / 86400), "day")}`;
}

export function getLatestTimestamp(
    timestamps: Array<string | null | undefined>
): string | null {
    let latest: string | null = null;
    let latestMs = -1;

    for (const ts of timestamps) {
        if (!ts) continue;
        const ms = Date.parse(ts);
        if (!Number.isFinite(ms)) continue;
        if (ms > latestMs) {
            latestMs = ms;
            latest = ts;
        }
    }

    return latest;
}

export function calculateFreshness(
    sourceTimestamp: string | null | undefined,
    nowMs = Date.now()
): FreshnessInfo {
    if (!sourceTimestamp) {
        return {
            sourceTimestamp: null,
            freshnessSeconds: null,
            freshnessLabel: "Data freshness unavailable",
        };
    }

    const sourceMs = Date.parse(sourceTimestamp);
    if (!Number.isFinite(sourceMs)) {
        return {
            sourceTimestamp: null,
            freshnessSeconds: null,
            freshnessLabel: "Data freshness unavailable",
        };
    }

    const freshnessSeconds = Math.max(0, Math.floor((nowMs - sourceMs) / 1000));

    return {
        sourceTimestamp,
        freshnessSeconds,
        freshnessLabel: toFreshnessLabel(freshnessSeconds),
    };
}