import { headers } from "next/headers";

export async function getServerApiUrl(path: string): Promise<string> {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
    const protocol = h.get("x-forwarded-proto") ?? "http";
    return `${protocol}://${host}${path}`;
}
