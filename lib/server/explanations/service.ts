import { getOptionalEnv } from "@/lib/env";
import { requestOpenRouterCompletion } from "@/lib/server/openrouter-client";
import {
    buildExplanationPrompt,
    buildTemplateExplanation,
    buildWeatherPrompt,
    ForecastExplanationInput,
} from "@/lib/server/explanations/templates";

export interface StationForecastExplanation {
    summary: string;
    weatherSummary: string;
    source: "openrouter" | "template";
}

type CacheEntry = {
    expiresAt: number;
    value: StationForecastExplanation;
};

const explanationCache = new Map<string, CacheEntry>();

function cacheTtlMs(): number {
    const raw = getOptionalEnv("OPENROUTER_CACHE_TTL_SECONDS");
    const seconds = raw ? Number(raw) : 900;
    if (!Number.isFinite(seconds) || seconds <= 0) return 900_000;
    return seconds * 1000;
}

function toCacheKey(input: ForecastExplanationInput): string {
    return JSON.stringify({
        stationName: input.stationName,
        predictedEntries: input.predictedEntries,
        baselineEntries: input.baselineEntries,
        deltaPercent: Number(input.deltaPercent.toFixed(2)),
        confidenceLevel: Number(input.confidenceLevel.toFixed(3)),
        weatherEffectScore: Number(input.weatherEffectScore.toFixed(3)),
        weatherCondition: input.weatherCondition,
        rushWindowLabel: input.rushWindowLabel,
    });
}

function clampSentence(value: string, fallback: string): string {
    const collapsed = value.replace(/\s+/g, " ").trim();
    if (!collapsed) return fallback;
    if (collapsed.length <= 180) return collapsed;
    return `${collapsed.slice(0, 177).trimEnd()}...`;
}

export async function generateStationForecastExplanation(
    input: ForecastExplanationInput
): Promise<StationForecastExplanation> {
    const key = toCacheKey(input);
    const now = Date.now();
    const cached = explanationCache.get(key);

    if (cached && cached.expiresAt > now) {
        return cached.value;
    }

    const template = buildTemplateExplanation(input);

    const [summaryFromLlm, weatherFromLlm] = await Promise.all([
        requestOpenRouterCompletion([
            {
                role: "system",
                content: "You are a concise transit explanation assistant. Keep output factual and short.",
            },
            {
                role: "user",
                content: buildExplanationPrompt(input),
            },
        ]),
        requestOpenRouterCompletion([
            {
                role: "system",
                content: "You are a concise transit weather explainer. Keep output factual and short.",
            },
            {
                role: "user",
                content: buildWeatherPrompt(input),
            },
        ]),
    ]);

    const hasLlmOutput = Boolean(summaryFromLlm && weatherFromLlm);

    const value: StationForecastExplanation = hasLlmOutput
        ? {
            summary: clampSentence(summaryFromLlm ?? "", template.summary),
            weatherSummary: clampSentence(weatherFromLlm ?? "", template.weatherSummary),
            source: "openrouter",
        }
        : {
            summary: template.summary,
            weatherSummary: template.weatherSummary,
            source: "template",
        };

    explanationCache.set(key, {
        value,
        expiresAt: now + cacheTtlMs(),
    });

    return value;
}
