import { getOptionalEnv } from "@/lib/env";

export interface OpenRouterMessage {
    role: "system" | "user";
    content: string;
}

interface OpenRouterRequest {
    model: string;
    messages: OpenRouterMessage[];
    temperature: number;
    top_p: number;
    max_tokens: number;
}

interface OpenRouterChoice {
    message?: {
        content?: string;
    };
}

interface OpenRouterResponse {
    choices?: OpenRouterChoice[];
}

export async function requestOpenRouterCompletion(
    messages: OpenRouterMessage[]
): Promise<string | null> {
    const apiKey = getOptionalEnv("OPENROUTER_API_KEY");
    if (!apiKey) return null;

    const model = getOptionalEnv("OPENROUTER_MODEL") ?? "openai/gpt-4o-mini";
    const referer = getOptionalEnv("OPENROUTER_HTTP_REFERER") ?? "http://localhost:3000";
    const title = getOptionalEnv("OPENROUTER_APP_TITLE") ?? "MetroPulse Baku";

    const payload: OpenRouterRequest = {
        model,
        messages,
        temperature: 0,
        top_p: 0.1,
        max_tokens: 80,
    };

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
                "HTTP-Referer": referer,
                "X-Title": title,
            },
            body: JSON.stringify(payload),
            cache: "no-store",
        });

        if (!response.ok) return null;

        const data = (await response.json()) as OpenRouterResponse;
        const content = data.choices?.[0]?.message?.content?.trim();
        if (!content) return null;

        return content.replace(/\s+/g, " ").trim();
    } catch {
        return null;
    }
}
