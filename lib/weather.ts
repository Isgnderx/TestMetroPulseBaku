import { WeatherCondition, WeatherObservation } from "@/types";
import { getOptionalEnv } from "@/lib/env";

const BAKU_LAT = 40.4093;
const BAKU_LON = 49.8671;

const OPEN_METEO_URL =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${BAKU_LAT}` +
    `&longitude=${BAKU_LON}` +
    "&timezone=Asia%2FBaku" +
    "&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,pressure_msl,wind_speed_10m,weather_code";

type OpenMeteoCurrentResponse = {
    current?: {
        time?: string;
        temperature_2m?: number;
        apparent_temperature?: number;
        relative_humidity_2m?: number;
        precipitation?: number;
        pressure_msl?: number;
        wind_speed_10m?: number;
        weather_code?: number;
    };
};

type OpenWeatherCurrentResponse = {
    dt?: number;
    main?: {
        temp?: number;
        feels_like?: number;
        humidity?: number;
        pressure?: number;
    };
    wind?: {
        speed?: number;
    };
    rain?: {
        "1h"?: number;
        "3h"?: number;
    };
    snow?: {
        "1h"?: number;
        "3h"?: number;
    };
    weather?: Array<{
        id?: number;
        main?: string;
        description?: string;
    }>;
};

function mapWeatherCodeToCondition(code?: number): WeatherCondition {
    if (code === 0) return "clear";
    if (code === 1 || code === 2) return "partly_cloudy";
    if (code === 3) return "cloudy";
    if (code === 45 || code === 48) return "fog";
    if (code === 51 || code === 53 || code === 55 || code === 56 || code === 57)
        return "rain";
    if (code === 61 || code === 63 || code === 65 || code === 66 || code === 67)
        return "rain";
    if (code === 71 || code === 73 || code === 75 || code === 77) return "snow";
    if (code === 80 || code === 81 || code === 82) return "heavy_rain";
    if (code === 85 || code === 86) return "snow";
    if (code === 95 || code === 96 || code === 99) return "storm";
    return "cloudy";
}

export async function getCurrentWeather(): Promise<WeatherObservation> {
    const openWeatherKey = getOptionalEnv("OPENWEATHER_KEY");

    if (openWeatherKey) {
        const openWeatherUrl =
            "https://api.openweathermap.org/data/2.5/weather" +
            `?lat=${BAKU_LAT}` +
            `&lon=${BAKU_LON}` +
            "&units=metric" +
            `&appid=${openWeatherKey}`;

        const weatherResponse = await fetch(openWeatherUrl, {
            headers: {
                Accept: "application/json",
            },
            next: { revalidate: 60 * 15 },
        });

        if (weatherResponse.ok) {
            const payload = (await weatherResponse.json()) as OpenWeatherCurrentResponse;
            const weatherCode = payload.weather?.[0]?.id;
            const windKmh = Math.round((payload.wind?.speed ?? 0) * 3.6);
            const precipitation = Number(
                ((payload.rain?.["1h"] ?? payload.snow?.["1h"] ?? payload.rain?.["3h"] ?? payload.snow?.["3h"] ?? 0) as number).toFixed(1)
            );

            return {
                observedAt: payload.dt
                    ? new Date(payload.dt * 1000).toISOString()
                    : new Date().toISOString(),
                tempC: Math.round(payload.main?.temp ?? 0),
                feelsLikeC: Math.round(payload.main?.feels_like ?? payload.main?.temp ?? 0),
                humidity: Math.round(payload.main?.humidity ?? 0),
                windSpeed: windKmh,
                precipitation,
                pressure: Math.round(payload.main?.pressure ?? 0),
                condition: mapWeatherCodeToCondition(weatherCode),
                createdAt: new Date().toISOString(),
            };
        }
    }

    const response = await fetch(OPEN_METEO_URL, {
        headers: {
            Accept: "application/json",
        },
        next: { revalidate: 60 * 30 },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch weather from Open-Meteo (${response.status})`);
    }

    const payload = (await response.json()) as OpenMeteoCurrentResponse;
    const current = payload.current;

    if (!current) {
        throw new Error("Open-Meteo response missing current weather");
    }

    return {
        observedAt: current.time ?? new Date().toISOString(),
        tempC: Math.round(current.temperature_2m ?? 0),
        feelsLikeC: Math.round(
            current.apparent_temperature ?? current.temperature_2m ?? 0
        ),
        humidity: Math.round(current.relative_humidity_2m ?? 0),
        windSpeed: Math.round(current.wind_speed_10m ?? 0),
        precipitation: Number((current.precipitation ?? 0).toFixed(1)),
        pressure: Math.round(current.pressure_msl ?? 0),
        condition: mapWeatherCodeToCondition(current.weather_code),
        createdAt: new Date().toISOString(),
    };
}
