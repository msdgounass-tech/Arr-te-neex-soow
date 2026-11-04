import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/env";

/**
 * Client « service role » : contourne RLS. À n'utiliser QUE côté serveur,
 * pour les opérations de confiance (création de commande, webhooks de paiement).
 */
let adminClient: SupabaseClient | null = null;
export function getServiceSupabase(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL manquant.");
  }
  if (!adminClient) {
    adminClient = createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return adminClient;
}
