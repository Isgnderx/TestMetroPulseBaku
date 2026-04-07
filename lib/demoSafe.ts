function parseBool(value: string | undefined): boolean {
    if (!value) return false;
    const normalized = value.trim().toLowerCase();
    return normalized === "1" || normalized === "true" || normalized === "yes";
}

function parsePositiveInt(value: string | undefined): number | null {
    if (!value) return null;
    const n = Number.parseInt(value, 10);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
}

export function isDemoSafeMode(): boolean {
    return (
        parseBool(process.env.DEMO_SAFE_MODE) ||
        parseBool(process.env.NEXT_PUBLIC_DEMO_SAFE_MODE)
    );
}

export function getDemoTimeoutMs(defaultTimeoutMs: number): number {
    const envTimeout =
        parsePositiveInt(process.env.DEMO_SAFE_TIMEOUT_MS) ??
        parsePositiveInt(process.env.NEXT_PUBLIC_DEMO_SAFE_TIMEOUT_MS);

    if (envTimeout) return envTimeout;
    if (isDemoSafeMode()) return Math.min(defaultTimeoutMs, 4000);
    return defaultTimeoutMs;
}

export async function withTimeout<T>(
    task: () => Promise<T>,
    timeoutMs: number,
    timeoutMessage = "Request timed out"
): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
        return await Promise.race([
            task(),
            new Promise<T>((_, reject) => {
                timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
            }),
        ]);
    } finally {
        if (timeoutId) clearTimeout(timeoutId);
    }
}

export async function fetchWithTimeout(
    input: RequestInfo | URL,
    init: RequestInit | undefined,
    timeoutMs: number,
    timeoutMessage = "Fetch timed out"
): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(timeoutMessage), timeoutMs);

    try {
        return await fetch(input, {
            ...init,
            signal: controller.signal,
        });
    } finally {
        clearTimeout(timeoutId);
    }
}