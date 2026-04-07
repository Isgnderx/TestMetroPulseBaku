import { fail, ok } from "@/lib/server/api-response";
import { getLeaderboardPayload } from "@/lib/server/live-api";
import { getLeaderboardPayload as getMockLeaderboardPayload } from "@/lib/server/mock-api";
import { LeaderboardFilter } from "@/types";
import { LeaderboardContract } from "@/types/contracts";

function parseFilter(value: string | null): LeaderboardFilter {
    if (value === "busier") return "busier";
    if (value === "quieter") return "quieter";
    if (value === "surge") return "surge";
    if (value === "normal") return "normal";
    return "all";
}

export async function GET(request: Request) {
    const url = new URL(request.url);
    const filter = parseFilter(url.searchParams.get("filter"));

    try {
        const payload = await getLeaderboardPayload(filter);
        return ok<LeaderboardContract>(payload, "supabase");
    } catch (error) {
        try {
            const payload = getMockLeaderboardPayload(filter);
            return ok<LeaderboardContract>(payload, "mock");
        } catch {
            const message = error instanceof Error ? error.message : "Failed to build leaderboard payload";
            return fail(500, "leaderboard_unavailable", message, "supabase");
        }
    }
}
