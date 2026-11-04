import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

/** Retour des liens e-mail Supabase (confirmation d'inscription, réinitialisation du mot de passe). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/compte";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/compte";
  if (code) {
    const sb = await getServerSupabase();
    await sb?.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL(safeNext, url.origin));
}
