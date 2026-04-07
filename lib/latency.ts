import { NextResponse } from "next/server";

export function latencyMsFromStart(startedAtMs: number): number {
    return Math.max(0, Date.now() - startedAtMs);
}

export function withLatencyHeaders<T extends NextResponse>(
    response: T,
    startedAtMs: number
): T {
    const latencyMs = latencyMsFromStart(startedAtMs);
    response.headers.set("X-Response-Time-Ms", String(latencyMs));
    response.headers.set("Server-Timing", `app;dur=${latencyMs}`);
    return response;
}