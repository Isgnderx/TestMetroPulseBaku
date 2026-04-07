type RequiredEnvOptions = {
    example?: string;
};

/**
 * Reads a required environment variable and throws a clear runtime error if missing.
 */
export function getRequiredEnv(
    name: string,
    options: RequiredEnvOptions = {}
): string {
    const value = process.env[name];

    if (typeof value !== "string" || value.trim() === "") {
        const hint = options.example ? ` Example: ${options.example}` : "";
        throw new Error(
            `Missing required environment variable ${name}. Add it to your environment configuration.${hint}`
        );
    }

    return value;
}

/**
 * Reads an optional environment variable.
 * Returns undefined when missing or empty.
 */
export function getOptionalEnv(name: string): string | undefined {
    const value = process.env[name];
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}
