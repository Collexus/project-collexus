import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicConfig } from "@/lib/env";

export async function createSupabaseServerClient() {
  const { url, key } = getSupabasePublicConfig();
  const cookieStore = await cookies();

  return createServerClient(url, key, {
    auth: { flowType: "pkce", detectSessionInUrl: true },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Server Components cannot write response cookies. proxy.ts refreshes sessions.
        }
      },
    },
  });
}
