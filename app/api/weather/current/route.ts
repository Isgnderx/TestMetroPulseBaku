import { fail, ok } from "@/lib/server/api-response";
import { getCurrentWeatherPayload } from "@/lib/server/live-api";
import { getCurrentWeatherPayload as getMockCurrentWeatherPayload } from "@/lib/server/mock-api";
import { getCurrentWeather } from "@/lib/weather";
import { WeatherCurrentContract } from "@/types/contracts";

function buildDemandInsight(payload: WeatherCurrentContract["weather"]): string {
    if (payload.precipitation >= 3 || payload.condition === "heavy_rain") {
        return "Rain conditions may increase station crowding around covered entrances.";
    }
    if (payload.windSpeed >= 30) {
        return "Strong winds usually shift riders toward shorter transfer paths and closer exits.";
    }
    if (payload.tempC >= 32) {
        return "High temperatures can move demand slightly later in the day as riders avoid peak heat.";
    }
    return "Weather impact is mild; station demand should mostly follow regular weekday patterns.";
}

export async function GET() {
    try {
        const weather = await getCurrentWeather();
        return ok<WeatherCurrentContract>(
            {
                weather,
                demandInsight: buildDemandInsight(weather),
            },
            "supabase"
        );
    } catch {
        // Fall through to Supabase weather source.
    }

    try {
        const payload: WeatherCurrentContract = await getCurrentWeatherPayload();
        return ok<WeatherCurrentContract>(payload, "supabase");
    } catch (error) {
        try {
            const payload: WeatherCurrentContract = getMockCurrentWeatherPayload();
            return ok<WeatherCurrentContract>(payload, "mock");
        } catch {
            const message = error instanceof Error ? error.message : "Failed to load weather";
            return fail(500, "weather_unavailable", message, "supabase");
        }
    }
}
