import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/env";

/** Client lié à la session de l'utilisateur (cookies) — soumis aux règles RLS. */
export async function getServerSupabase(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured) return null;
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Appelé depuis un Server Component : le middleware se charge du rafraîchissement.
        }
      },
    },
  });
}

/** Client public sans cookies — pour le catalogue (mise en cache possible). */
let publicClient: SupabaseClient | null = null;
export function getPublicSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!publicClient) {
    publicClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return publicClient;
}
