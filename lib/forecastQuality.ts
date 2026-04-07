export type ForecastActualPair = {
    forecastDate: string;
    predictedEntries: number;
    actualEntries: number;
};

export type ForecastQualityResult = {
    status: "live" | "insufficient-data";
    metric: "MAPE";
    value: number | null;
    sampleSize: number;
    mae: number | null;
    note: string;
};

type EvaluateOptions = {
    minSamples?: number;
};

export function evaluateForecastQuality(
    pairs: ForecastActualPair[],
    options: EvaluateOptions = {}
): ForecastQualityResult {
    const minSamples = options.minSamples ?? 7;

    if (pairs.length < minSamples) {
        return {
            status: "insufficient-data",
            metric: "MAPE",
            value: null,
            sampleSize: pairs.length,
            mae: null,
            note: `Insufficient matched forecast/actual days (need at least ${minSamples}).`,
        };
    }

    let absErrorSum = 0;
    let absPctErrorSum = 0;
    let pctCount = 0;

    for (const pair of pairs) {
        const absError = Math.abs(pair.predictedEntries - pair.actualEntries);
        absErrorSum += absError;

        if (pair.actualEntries > 0) {
            absPctErrorSum += absError / pair.actualEntries;
            pctCount += 1;
        }
    }

    const mae = absErrorSum / pairs.length;

    if (pctCount < minSamples) {
        return {
            status: "insufficient-data",
            metric: "MAPE",
            value: null,
            sampleSize: pairs.length,
            mae: Number(mae.toFixed(2)),
            note:
                "Insufficient non-zero actual values for a stable MAPE calculation.",
        };
    }

    const mapePercent = (absPctErrorSum / pctCount) * 100;

    return {
        status: "live",
        metric: "MAPE",
        value: Number(mapePercent.toFixed(2)),
        sampleSize: pairs.length,
        mae: Number(mae.toFixed(2)),
        note:
            `MAPE computed from ${pairs.length} matched forecast/actual days; lower is better.`,
    };
}