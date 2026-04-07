import { fail, ok } from "@/lib/server/api-response";
import { getStationBestTimePayload } from "@/lib/server/live-api";
import { getStationBestTimePayload as getMockStationBestTimePayload } from "@/lib/server/mock-api";
import { StationBestTimeContract } from "@/types/contracts";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const payload = await getStationBestTimePayload(slug);

        if (!payload) {
            return fail(404, "station_not_found", "Station not found", "supabase");
        }

        return ok<StationBestTimeContract>(payload, "supabase");
    } catch (error) {
        const { slug } = await params;
        const fallback = getMockStationBestTimePayload(slug);
        if (fallback) {
            return ok<StationBestTimeContract>(fallback, "mock");
        }
        const message = error instanceof Error ? error.message : "Failed to load station best time";
        return fail(500, "station_best_time_unavailable", message, "supabase");
    }
}
