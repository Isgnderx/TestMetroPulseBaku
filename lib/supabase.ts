import { createClient } from "@supabase/supabase-js";
import { getOptionalEnv, getRequiredEnv } from "@/lib/env";

type SupabaseClient = ReturnType<typeof createClient>;

function getSupabaseBaseConfig() {
  const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL", {
    example: "https://your-project.supabase.co",
  });
  const supabasePublishableKey =
    getOptionalEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY") ??
    getOptionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!supabasePublishableKey) {
    throw new Error(
      "Missing required environment variable NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add one to your environment configuration."
    );
  }

  return { supabaseUrl, supabasePublishableKey };
}

export function createAnonClient() {
  const { supabaseUrl, supabasePublishableKey } = getSupabaseBaseConfig();
  return createClient(supabaseUrl, supabasePublishableKey);
}

// Lazy proxy keeps import-time safe during build while preserving runtime env validation.
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = createAnonClient();
    const value = Reflect.get(client as object, prop, receiver);
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
}) as SupabaseClient;

// Server-side client with service role (for ETL / admin routes)
export function createServiceClient() {
  const { supabaseUrl } = getSupabaseBaseConfig();
  const serviceKey =
    getOptionalEnv("SUPABASE_SECRET_KEY") ??
    getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!serviceKey) {
    throw new Error(
      "Missing required environment variable SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY. Add one to your environment configuration."
    );
  }

  return createClient(
    supabaseUrl,
    serviceKey,
    { auth: { persistSession: false } }
  );
}
