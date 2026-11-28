import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/** Retour des liens envoyés par e-mail (confirmation d'inscription, réinitialisation du mot de passe). */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("suite") ?? "/auth/destination";
  const safe = next.startsWith("/") && !next.startsWith("//") ? next : "/auth/destination";
  if (code) {
    const sb = await supabaseServer();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(new URL("/connexion?erreur=lien", url.origin));
  }
  return NextResponse.redirect(new URL(safe, url.origin));
}
