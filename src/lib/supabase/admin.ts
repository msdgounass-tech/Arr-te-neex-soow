import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/env";

export const hasServiceKey = () => Boolean(SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

/**
 * Client « service role » : contourne RLS. À n'utiliser QUE côté serveur, et
 * seulement pour les intégrations qui l'exigent (webhooks de paiement par API,
 * journal des notifications). Les parcours essentiels passent par des fonctions
 * SQL sécurisées appelables avec la clé publique (voir 0006_public_rpcs.sql).
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
