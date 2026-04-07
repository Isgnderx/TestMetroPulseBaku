import { fail, ok } from "@/lib/server/api-response";
import { getStationDetailPayload } from "@/lib/server/live-api";
import { getStationDetailPayload as getMockStationDetailPayload } from "@/lib/server/mock-api";
import { StationDetailContract } from "@/types/contracts";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const payload = await getStationDetailPayload(slug);

        if (!payload) {
            return fail(404, "station_not_found", "Station not found", "supabase");
        }

        return ok<StationDetailContract>(payload, "supabase");
    } catch (error) {
        const { slug } = await params;
        const fallback = getMockStationDetailPayload(slug);
        if (fallback) {
            return ok<StationDetailContract>(fallback, "mock");
        }
        const message = error instanceof Error ? error.message : "Failed to load station detail";
        return fail(500, "station_detail_unavailable", message, "supabase");
    }
}
