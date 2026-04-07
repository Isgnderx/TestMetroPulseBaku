import { fail, ok } from "@/lib/server/api-response";
import { getStationForecastPayload } from "@/lib/server/live-api";
import { getStationForecastPayload as getMockStationForecastPayload } from "@/lib/server/mock-api";
import { StationForecastContract } from "@/types/contracts";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const payload = await getStationForecastPayload(slug);

        if (!payload) {
            return fail(404, "station_not_found", "Station not found", "supabase");
        }

        return ok<StationForecastContract>(payload, "supabase");
    } catch (error) {
        const { slug } = await params;
        const fallback = getMockStationForecastPayload(slug);
        if (fallback) {
            return ok<StationForecastContract>(fallback, "mock");
        }
        const message = error instanceof Error ? error.message : "Failed to load station forecast";
        return fail(500, "station_forecast_unavailable", message, "supabase");
    }
}
