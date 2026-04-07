import { ApiMeta, ApiSuccess } from "@/types/contracts";

export interface ApiFetchResult<T> {
    data: T | null;
    error: string | null;
    status: number;
    meta: ApiMeta | null;
}

type NextFetchOptions = RequestInit & {
    next?: {
        revalidate?: number;
        tags?: string[];
    };
};

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function hasErrorEnvelope(value: unknown): value is { error: { message?: string }; meta?: ApiMeta } {
    if (!isObject(value) || !("error" in value)) return false;
    const maybeError = (value as { error?: unknown }).error;
    return isObject(maybeError);
}

function hasSuccessEnvelope<T>(value: unknown): value is { data: T; meta?: ApiMeta } {
    return isObject(value) && "data" in value;
}

function toErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return "Unexpected API error";
}

function fallbackMeta(): ApiMeta {
    return {
        source: "mock",
        generatedAt: new Date().toISOString(),
        version: "v1",
    };
}

export async function fetchApi<T>(
    input: RequestInfo | URL,
    init?: NextFetchOptions
): Promise<ApiFetchResult<T>> {
    try {
        const response = await fetch(input, init);
        const json = (await response.json()) as unknown;

        if (!isObject(json)) {
            return {
                data: null,
                error: "Malformed API response",
                status: response.status,
                meta: null,
            };
        }

        if (hasErrorEnvelope(json)) {
            return {
                data: null,
                error: json.error.message ?? "API request failed",
                status: response.status,
                meta: json.meta ?? null,
            };
        }

        if (!hasSuccessEnvelope<T>(json)) {
            return {
                data: null,
                error: "Malformed API success response",
                status: response.status,
                meta: null,
            };
        }

        const apiSuccess: ApiSuccess<T> = {
            data: json.data,
            meta: json.meta ?? fallbackMeta(),
        };
        return {
            data: apiSuccess.data ?? null,
            error: response.ok ? null : "Request failed",
            status: response.status,
            meta: apiSuccess.meta ?? null,
        };
    } catch (error) {
        return {
            data: null,
            error: toErrorMessage(error),
            status: 500,
            meta: null,
        };
    }
}
