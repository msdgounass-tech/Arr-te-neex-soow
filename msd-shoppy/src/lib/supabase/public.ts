import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";

/** Client anonyme sans cookies : données publiques, compatible avec la mise en cache des pages. */
export function supabasePublic() {
  return createClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, { auth: { persistSession: false } });
}
