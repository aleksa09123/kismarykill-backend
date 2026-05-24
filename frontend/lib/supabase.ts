import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";

let cachedSupabaseClient: SupabaseClient | null | undefined;

function resolvePublicSupabaseConfig(): { url: string; anonKey: string } | null {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  if (!url || !anonKey) {
    return null;
  }
  return { url, anonKey };
}

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (cachedSupabaseClient !== undefined) {
    return cachedSupabaseClient;
  }
  if (typeof window === "undefined") {
    cachedSupabaseClient = null;
    return cachedSupabaseClient;
  }

  const config = resolvePublicSupabaseConfig();
  if (!config) {
    cachedSupabaseClient = null;
    return cachedSupabaseClient;
  }

  cachedSupabaseClient = createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
  return cachedSupabaseClient;
}

export async function getSupabaseAuthSession(): Promise<Session | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  return data.session ?? null;
}
