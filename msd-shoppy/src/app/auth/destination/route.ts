import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/** Après connexion : page demandée si précisée, sinon administration (admin), espace vendeur (boutique) ou compte. */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const suite = url.searchParams.get("suite");
  const go = (p: string) => NextResponse.redirect(new URL(p, url.origin));
  if (suite && suite.startsWith("/") && !suite.startsWith("//") && suite !== "/compte") return go(suite);
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return go("/connexion");
  const [{ data: profile }, { data: shop }] = await Promise.all([
    sb.from("profiles").select("is_platform_admin").eq("id", user.id).maybeSingle(),
    sb.from("shops").select("id").eq("owner_id", user.id).maybeSingle()]);
  if (profile?.is_platform_admin) return go("/admin");
  if (shop) return go("/vendeur");
  return go("/compte");
}
