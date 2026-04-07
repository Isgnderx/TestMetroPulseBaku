import { EstimatedHourlyDemand, IntradayProfileType, StationType } from "@/types";
import { formatHour } from "@/lib/utils";

export interface OperatingHoursWindow {
    startHour: number;
    endHour: number;
}

export interface IntradayEstimateInput {
    dailyForecastEntries: number;
    profileType: IntradayProfileType;
    isWeekend: boolean;
    customShares?: Array<{ hour: number; share: number }>;
}

export interface IntradayEstimateResult {
    profileType: IntradayProfileType;
    operatingHours: OperatingHoursWindow;
    estimatedHourly: EstimatedHourlyDemand[];
    rushWindow: {
        startHour: number;
        endHour: number;
        label: string;
    };
    quietWindow: {
        startHour: number;
        endHour: number;
        label: string;
    };
    bestTimeToEnterHour: number;
    bestTimeToEnterLabel: string;
    methodologyNote: string;
}

const OPERATING_HOURS: OperatingHoursWindow = {
    startHour: 6,
    endHour: 23,
};

const TEMPLATE_WEIGHTS: Record<IntradayProfileType, { weekday: number[]; weekend: number[] }> = {
    "commuter-heavy": {
        weekday: [
            0.2, 0.1, 0.1, 0.1, 0.2, 0.6, 1.8, 3.1, 2.8, 2.0, 1.4, 1.3,
            1.4, 1.5, 1.7, 2.0, 2.5, 3.0, 2.9, 2.2, 1.6, 1.1, 0.8, 0.4,
        ],
        weekend: [
            0.2, 0.1, 0.1, 0.1, 0.2, 0.5, 1.0, 1.3, 1.5, 1.7, 1.9, 2.0,
            2.1, 2.2, 2.2, 2.3, 2.4, 2.5, 2.3, 1.9, 1.5, 1.1, 0.8, 0.4,
        ],
    },
    "transfer-heavy": {
        weekday: [
            0.2, 0.1, 0.1, 0.1, 0.2, 0.5, 1.6, 2.5, 2.7, 2.3, 2.0, 1.9,
            1.9, 2.0, 2.1, 2.3, 2.6, 2.9, 2.8, 2.3, 1.8, 1.4, 1.0, 0.5,
        ],
        weekend: [
            0.2, 0.1, 0.1, 0.1, 0.2, 0.4, 0.9, 1.1, 1.4, 1.8, 2.1, 2.3,
            2.4, 2.5, 2.5, 2.6, 2.6, 2.7, 2.5, 2.2, 1.8, 1.4, 1.0, 0.5,
        ],
    },
    residential: {
        weekday: [
            0.2, 0.1, 0.1, 0.1, 0.2, 0.7, 1.9, 2.9, 2.5, 1.7, 1.2, 1.1,
            1.2, 1.3, 1.5, 1.8, 2.2, 2.8, 3.0, 2.5, 1.8, 1.3, 0.9, 0.4,
        ],
        weekend: [
            0.2, 0.1, 0.1, 0.1, 0.2, 0.4, 0.8, 1.0, 1.2, 1.5, 1.8, 2.1,
            2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.6, 2.2, 1.8, 1.3, 0.9, 0.4,
        ],
    },
    "mixed-use": {
        weekday: [
            0.2, 0.1, 0.1, 0.1, 0.2, 0.5, 1.4, 2.1, 2.2, 1.9, 1.8, 1.8,
            1.9, 2.0, 2.1, 2.3, 2.5, 2.8, 2.7, 2.3, 1.9, 1.4, 1.0, 0.5,
        ],
        weekend: [
            0.2, 0.1, 0.1, 0.1, 0.2, 0.4, 0.9, 1.1, 1.4, 1.7, 2.0, 2.2,
            2.3, 2.4, 2.5, 2.6, 2.7, 2.7, 2.5, 2.2, 1.8, 1.4, 1.0, 0.5,
        ],
    },
    central: {
        weekday: [
            0.2, 0.1, 0.1, 0.1, 0.2, 0.4, 1.2, 1.9, 2.1, 2.0, 2.1, 2.2,
            2.3, 2.4, 2.5, 2.6, 2.8, 3.0, 2.8, 2.4, 1.9, 1.4, 1.0, 0.5,
        ],
        weekend: [
            0.2, 0.1, 0.1, 0.1, 0.2, 0.3, 0.7, 1.0, 1.3, 1.8, 2.2, 2.5,
            2.7, 2.8, 2.9, 2.9, 3.0, 3.0, 2.8, 2.4, 1.9, 1.4, 1.0, 0.5,
        ],
    },
};

export function getProfileTypeFromStationType(stationType: StationType | null): IntradayProfileType {
    if (stationType === "commuter") return "commuter-heavy";
    if (stationType === "transfer") return "transfer-heavy";
    if (stationType === "residential") return "residential";
    if (stationType === "central" || stationType === "business" || stationType === "tourist") {
        return "central";
    }
    return "mixed-use";
}

function normalizeShares(rawShares: number[]): number[] {
    const withOperatingHours = rawShares.map((share, hour) => {
        if (hour < OPERATING_HOURS.startHour || hour > OPERATING_HOURS.endHour) return 0;
        return Math.max(0, share);
    });

    const total = withOperatingHours.reduce((sum, value) => sum + value, 0);
    if (total <= 0) {
        const operatingHoursCount = OPERATING_HOURS.endHour - OPERATING_HOURS.startHour + 1;
        return withOperatingHours.map((_, hour) => {
            if (hour < OPERATING_HOURS.startHour || hour > OPERATING_HOURS.endHour) return 0;
            return 1 / operatingHoursCount;
        });
    }

    return withOperatingHours.map((value) => value / total);
}

function resolveShares(input: IntradayEstimateInput): number[] {
    const template = input.isWeekend
        ? TEMPLATE_WEIGHTS[input.profileType].weekend
        : TEMPLATE_WEIGHTS[input.profileType].weekday;

    if (!input.customShares || input.customShares.length === 0) {
        return normalizeShares(template);
    }

    const candidate = new Array<number>(24).fill(0);
    for (const item of input.customShares) {
        if (item.hour < 0 || item.hour > 23) continue;
        candidate[item.hour] = Math.max(0, item.share);
    }

    return normalizeShares(candidate);
}

function windowLabel(startHour: number, endHour: number): string {
    return `${formatHour(startHour)} - ${formatHour(endHour)}`;
}

function pickWindow(estimated: EstimatedHourlyDemand[], size: number, mode: "max" | "min") {
    const operating = estimated.filter(
        (item) => item.hour >= OPERATING_HOURS.startHour && item.hour <= OPERATING_HOURS.endHour
    );

    let bestStart = OPERATING_HOURS.startHour;
    let bestScore = mode === "max" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;

    for (let i = 0; i <= operating.length - size; i += 1) {
        const slice = operating.slice(i, i + size);
        const score = slice.reduce((sum, item) => sum + item.estimatedEntries, 0);

        if (mode === "max" && score > bestScore) {
            bestScore = score;
            bestStart = slice[0].hour;
        }

        if (mode === "min" && score < bestScore) {
            bestScore = score;
            bestStart = slice[0].hour;
        }
    }

    return {
        startHour: bestStart,
        endHour: Math.min(bestStart + size - 1, OPERATING_HOURS.endHour),
    };
}

export function buildIntradayEstimate(input: IntradayEstimateInput): IntradayEstimateResult {
    const shares = resolveShares(input);
    const estimatedHourly = shares.map((share, hour) => ({
        hour,
        estimatedEntries: Math.round(input.dailyForecastEntries * share),
        isRush: false,
        label: "Modeled hourly estimate",
    }));

    const rushWindow = pickWindow(estimatedHourly, 3, "max");
    const quietWindow = pickWindow(estimatedHourly, 2, "min");

    const rushSet = new Set<number>();
    for (let hour = rushWindow.startHour; hour <= rushWindow.endHour; hour += 1) {
        rushSet.add(hour);
    }

    const estimatedWithFlags = estimatedHourly.map((item) => ({
        ...item,
        isRush: rushSet.has(item.hour),
        label: rushSet.has(item.hour) ? "Estimated crowd window" : "Modeled quieter flow",
    }));

    const bestTimeToEnterHour = quietWindow.startHour;

    return {
        profileType: input.profileType,
        operatingHours: OPERATING_HOURS,
        estimatedHourly: estimatedWithFlags,
        rushWindow: {
            ...rushWindow,
            label: windowLabel(rushWindow.startHour, rushWindow.endHour),
        },
        quietWindow: {
            ...quietWindow,
            label: windowLabel(quietWindow.startHour, quietWindow.endHour),
        },
        bestTimeToEnterHour,
        bestTimeToEnterLabel: `Around ${formatHour(bestTimeToEnterHour)}`,
        methodologyNote:
            "Modeled from daily station demand patterns and station profile templates. These are estimated hourly windows, not observed hourly counts.",
    };
}
