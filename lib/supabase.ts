import { createClient } from "@supabase/supabase-js";
import { getRequiredEnv } from "@/lib/env";

type SupabaseClient = ReturnType<typeof createClient>;

function getSupabaseBaseConfig() {
  const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL", {
    example: "https://your-project.supabase.co",
  });
  const supabaseAnonKey = getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", {
    example: "eyJhbGciOiJI...",
  });

  return { supabaseUrl, supabaseAnonKey };
}

export function createAnonClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseBaseConfig();
  return createClient(supabaseUrl, supabaseAnonKey);
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
  const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY", {
    example: "eyJhbGciOiJI...",
  });

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    { auth: { persistSession: false } }
  );
}
