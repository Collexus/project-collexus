import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
let client: SupabaseClient | null = null;

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseKey);
}

export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseKey) return null;
  if (!client) {
    client = createBrowserClient(supabaseUrl, supabaseKey, {
      auth: { flowType: "pkce", detectSessionInUrl: true },
    });
  }
  return client;
}
