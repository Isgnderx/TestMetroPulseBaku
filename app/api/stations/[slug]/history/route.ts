import { fail, ok } from "@/lib/server/api-response";
import { getStationHistoryPayload } from "@/lib/server/live-api";
import { getStationHistoryPayload as getMockStationHistoryPayload } from "@/lib/server/mock-api";
import { StationHistoryContract } from "@/types/contracts";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const payload = await getStationHistoryPayload(slug);

        if (!payload) {
            return fail(404, "station_not_found", "Station not found", "supabase");
        }

        return ok<StationHistoryContract>(payload, "supabase");
    } catch (error) {
        const { slug } = await params;
        const fallback = getMockStationHistoryPayload(slug);
        if (fallback) {
            return ok<StationHistoryContract>(fallback, "mock");
        }
        const message = error instanceof Error ? error.message : "Failed to load station history";
        return fail(500, "station_history_unavailable", message, "supabase");
    }
}
