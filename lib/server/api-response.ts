import { NextResponse } from "next/server";
import { ApiError, ApiMeta, ApiSuccess } from "@/types/contracts";

export function buildMeta(source: ApiMeta["source"] = "mock"): ApiMeta {
    return {
        source,
        generatedAt: new Date().toISOString(),
        version: "v1",
    };
}

export function ok<T>(data: T, source: ApiMeta["source"] = "mock") {
    const payload: ApiSuccess<T> = {
        data,
        meta: buildMeta(source),
    };
    return NextResponse.json(payload);
}

export function fail(
    status: number,
    code: string,
    message: string,
    source: ApiMeta["source"] = "mock"
) {
    const payload: ApiError = {
        error: {
            code,
            message,
        },
        meta: buildMeta(source),
    };

    return NextResponse.json(payload, { status });
}
