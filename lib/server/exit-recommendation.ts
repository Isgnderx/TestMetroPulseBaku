import { ScoredExit } from "@/types";

type ExitInput = {
    id: string;
    stationId: string;
    exitNo: number;
    exitLabel: string;
    addressText: string;
    lat: number;
    lon: number;
    isAccessible: boolean;
    notes?: string;
};

export interface ExitRecommendationInput {
    exits: ExitInput[];
    destination?: { lat: number; lon: number };
}

export interface ExitRecommendationResult {
    scoringMode: "straight-line-distance";
    sortedExits: ScoredExit[];
    closestExit: ScoredExit | null;
    balancedExit: ScoredExit | null;
    leastCrowdedExit: ScoredExit | null;
    methodologyNote: string;
}

interface DistanceEngine {
    mode: "straight-line-distance";
    getDistanceMeters(from: { lat: number; lon: number }, to: { lat: number; lon: number }): number;
}

class StraightLineDistanceEngine implements DistanceEngine {
    mode: "straight-line-distance" = "straight-line-distance";

    getDistanceMeters(from: { lat: number; lon: number }, to: { lat: number; lon: number }): number {
        const toRad = (value: number) => (value * Math.PI) / 180;
        const earthRadiusM = 6371000;
        const dLat = toRad(to.lat - from.lat);
        const dLon = toRad(to.lon - from.lon);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        return Math.round(2 * earthRadiusM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    }
}

function normalize(rawValue: number, maxValue: number): number {
    if (maxValue <= 0) return 0;
    return Math.max(0, Math.min(1, rawValue / maxValue));
}

function inferCrowdPenalty(exitNo: number): number {
    if (exitNo <= 1) return 0.25;
    if (exitNo <= 2) return 0.18;
    if (exitNo <= 3) return 0.12;
    return 0.08;
}

function inferClosurePenalty(notes?: string): number {
    if (!notes) return 0;
    const lower = notes.toLowerCase();
    if (lower.includes("closed") || lower.includes("maintenance")) return 1;
    if (lower.includes("partial")) return 0.45;
    return 0;
}

function inferAccessibilityPenalty(isAccessible: boolean): number {
    return isAccessible ? 0 : 0.2;
}

function withFallbackRanking(exits: ExitInput[]): ScoredExit[] {
    return exits
        .map((exit, index) => {
            const crowdPenalty = inferCrowdPenalty(exit.exitNo);
            const closurePenalty = inferClosurePenalty(exit.notes);
            const accessibilityPenalty = inferAccessibilityPenalty(exit.isAccessible);
            const convenienceBoost = exit.isAccessible ? 0.08 : 0;

            const genericScore =
                (index + 1) +
                crowdPenalty * 8 +
                closurePenalty * 14 +
                accessibilityPenalty * 4 -
                convenienceBoost * 6;

            return {
                id: exit.id,
                stationId: exit.stationId,
                exitNo: exit.exitNo,
                exitLabel: exit.exitLabel,
                addressText: exit.addressText,
                lat: exit.lat,
                lon: exit.lon,
                isAccessible: exit.isAccessible,
                notes: exit.notes,
                score: Number(genericScore.toFixed(2)),
                crowdPenalty,
                closurePenalty,
                accessibilityPenalty,
                convenienceBoost,
                scoringNote: "Ranked by generic convenience heuristic without destination pin.",
            } as ScoredExit;
        })
        .sort((a, b) => a.score - b.score);
}

export function rankStationExits(input: ExitRecommendationInput): ExitRecommendationResult {
    const distanceEngine = new StraightLineDistanceEngine();

    if (!input.destination) {
        const sorted = withFallbackRanking(input.exits).map((exit, index) => ({
            ...exit,
            tag:
                index === 0
                    ? ("closest" as const)
                    : index === 1
                        ? ("balanced" as const)
                        : index === 2
                            ? ("least-crowded" as const)
                            : undefined,
        }));

        return {
            scoringMode: distanceEngine.mode,
            sortedExits: sorted,
            closestExit: sorted[0] ?? null,
            balancedExit: sorted[1] ?? sorted[0] ?? null,
            leastCrowdedExit: sorted[2] ?? sorted[0] ?? null,
            methodologyNote:
                "No destination pin selected. Exits are ranked by generic convenience heuristics (crowd, closure, and accessibility placeholders).",
        };
    }

    const scored = input.exits.map((exit) => {
        const distanceMeters = distanceEngine.getDistanceMeters(input.destination!, {
            lat: exit.lat,
            lon: exit.lon,
        });

        const crowdPenalty = inferCrowdPenalty(exit.exitNo);
        const closurePenalty = inferClosurePenalty(exit.notes);
        const accessibilityPenalty = inferAccessibilityPenalty(exit.isAccessible);
        const convenienceBoost = exit.isAccessible ? 0.08 : 0;

        const normalizedDistance = normalize(distanceMeters, 1500);

        const finalScore =
            normalizedDistance * 100 +
            crowdPenalty * 22 +
            closurePenalty * 85 +
            accessibilityPenalty * 12 -
            convenienceBoost * 10;

        return {
            id: exit.id,
            stationId: exit.stationId,
            exitNo: exit.exitNo,
            exitLabel: exit.exitLabel,
            addressText: exit.addressText,
            lat: exit.lat,
            lon: exit.lon,
            isAccessible: exit.isAccessible,
            notes: exit.notes,
            distanceMeters,
            score: Number(finalScore.toFixed(2)),
            crowdPenalty,
            closurePenalty,
            accessibilityPenalty,
            convenienceBoost,
            scoringNote:
                "Scored with straight-line distance plus crowd, closure, and accessibility heuristic penalties.",
        } as ScoredExit;
    });

    const sortedByScore = scored.sort((a, b) => a.score - b.score);
    const closestByDistance = [...scored].sort(
        (a, b) => (a.distanceMeters ?? Number.MAX_SAFE_INTEGER) - (b.distanceMeters ?? Number.MAX_SAFE_INTEGER)
    )[0] ?? null;

    const leastCrowded = [...scored].sort((a, b) => (a.crowdPenalty ?? 0) - (b.crowdPenalty ?? 0))[0] ?? null;
    const balanced = sortedByScore[0] ?? null;

    const tagged = sortedByScore.map((exit) => ({
        ...exit,
        tag:
            closestByDistance && exit.id === closestByDistance.id
                ? ("closest" as const)
                : balanced && exit.id === balanced.id
                    ? ("balanced" as const)
                    : leastCrowded && exit.id === leastCrowded.id
                        ? ("least-crowded" as const)
                        : undefined,
    }));

    return {
        scoringMode: distanceEngine.mode,
        sortedExits: tagged,
        closestExit: tagged.find((exit) => exit.id === closestByDistance?.id) ?? null,
        balancedExit: tagged.find((exit) => exit.id === balanced?.id) ?? null,
        leastCrowdedExit: tagged.find((exit) => exit.id === leastCrowded?.id) ?? null,
        methodologyNote:
            "Distances use straight-line geospatial calculations. Routing and live crowd telemetry can be integrated later without changing the endpoint contract.",
    };
}
