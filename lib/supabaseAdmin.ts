import { createClient, SupabaseClient } from "@supabase/supabase-js";

// One shared client, created the first time it is needed (never while the
// site is being built), using the service role key. Row-level security is
// on with no policies, so this key is the only way in -- and it only ever
// exists on the server, never in a student's browser.
let cached: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set in Vercel.");
  }

  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}
