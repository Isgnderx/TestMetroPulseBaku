export interface ForecastExplanationInput {
    stationName: string;
    predictedEntries: number;
    baselineEntries: number;
    deltaPercent: number;
    confidenceLevel: number;
    weatherEffectScore: number;
    weatherCondition: string;
    rushWindowLabel: string;
}

export interface ForecastExplanationOutput {
    summary: string;
    weatherSummary: string;
}

function demandPhrase(deltaPercent: number): string {
    if (deltaPercent >= 25) return "much busier than usual";
    if (deltaPercent >= 10) return "busier than usual";
    if (deltaPercent <= -25) return "much quieter than usual";
    if (deltaPercent <= -10) return "quieter than usual";
    return "close to its usual level";
}

function weatherPhrase(score: number, condition: string): string {
    if (score >= 0.25) {
        return `Weather may add pressure today, with ${condition} conditions likely nudging ridership higher.`;
    }
    if (score <= -0.25) {
        return `Weather may ease pressure slightly, with ${condition} conditions likely softening demand.`;
    }
    return `Weather influence looks mild today, and ${condition} conditions are not expected to shift demand significantly.`;
}

export function buildExplanationPrompt(input: ForecastExplanationInput): string {
    return [
        "Write one short rider-friendly sentence (max 22 words).",
        "Do not mention AI, model names, or uncertainty math.",
        "Do not change any numeric meaning.",
        `Station: ${input.stationName}`,
        `Predicted entries: ${input.predictedEntries}`,
        `Baseline entries: ${input.baselineEntries}`,
        `Delta percent: ${input.deltaPercent.toFixed(1)}%`,
        `Confidence level: ${input.confidenceLevel.toFixed(2)}`,
        `Weather effect score: ${input.weatherEffectScore.toFixed(2)}`,
        `Likely rush window: ${input.rushWindowLabel}`,
    ].join("\n");
}

export function buildWeatherPrompt(input: ForecastExplanationInput): string {
    return [
        "Write one short weather-focused rider sentence (max 20 words).",
        "Keep wording practical and calm.",
        "Avoid claiming observed real-time occupancy.",
        `Station: ${input.stationName}`,
        `Weather condition: ${input.weatherCondition}`,
        `Weather effect score: ${input.weatherEffectScore.toFixed(2)}`,
        `Likely rush window: ${input.rushWindowLabel}`,
    ].join("\n");
}

export function buildTemplateExplanation(input: ForecastExplanationInput): ForecastExplanationOutput {
    const demand = demandPhrase(input.deltaPercent);
    const summary = `${input.stationName} is expected to be ${demand} today, with the busiest period likely around ${input.rushWindowLabel}.`;
    const weatherSummary = weatherPhrase(input.weatherEffectScore, input.weatherCondition);

    return {
        summary,
        weatherSummary,
    };
}
