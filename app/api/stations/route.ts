import { fail, ok } from "@/lib/server/api-response";
import { getStationsPayload } from "@/lib/server/live-api";
import { getStationsPayload as getMockStationsPayload } from "@/lib/server/mock-api";
import { StationsListContract } from "@/types/contracts";

export async function GET() {
    try {
        const payload: StationsListContract = await getStationsPayload();
        return ok<StationsListContract>(payload, "supabase");
    } catch (error) {
        try {
            const payload: StationsListContract = getMockStationsPayload();
            return ok<StationsListContract>(payload, "mock");
        } catch {
            const message = error instanceof Error ? error.message : "Failed to load stations";
            return fail(500, "stations_unavailable", message, "supabase");
        }
    }
}
