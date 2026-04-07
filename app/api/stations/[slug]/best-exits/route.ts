import { fail, ok } from "@/lib/server/api-response";
import { getStationBestExitsPayload, parseOptionalCoordinates } from "@/lib/server/live-api";
import { getStationBestExitsPayload as getMockStationBestExitsPayload } from "@/lib/server/mock-api";
import { StationBestExitsContract } from "@/types/contracts";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const url = new URL(request.url);
    const latRaw = url.searchParams.get("lat");
    const lonRaw = url.searchParams.get("lon");
    const destination = parseOptionalCoordinates(latRaw, lonRaw);

    if ((latRaw || lonRaw) && !destination) {
        return fail(400, "invalid_coordinates", "Invalid or incomplete lat/lon query params", "supabase");
    }

    try {
        const { slug } = await params;

        const payload = await getStationBestExitsPayload(slug, destination ?? undefined);
        if (!payload) {
            return fail(404, "station_not_found", "Station not found", "supabase");
        }

        return ok<StationBestExitsContract>(payload, "supabase");
    } catch (error) {
        const { slug } = await params;
        const fallback = getMockStationBestExitsPayload(slug, destination ?? undefined);
        if (fallback) {
            return ok<StationBestExitsContract>(fallback, "mock");
        }
        const message = error instanceof Error ? error.message : "Failed to load station exits";
        return fail(500, "station_exits_unavailable", message, "supabase");
    }
}
