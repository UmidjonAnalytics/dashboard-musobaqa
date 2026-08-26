import { createClient, SupabaseClient } from "@supabase/supabase-js";

// A single shared client, created only when first needed (never at build
// time), using the service role key. Row-level security is on with no
// policies, so this is the only key that can read or write anything.
let cached: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable is not set."
    );
  }

  cached = createClient(url, key, {
    auth: { persistSession: false },
  });
  return cached;
}
