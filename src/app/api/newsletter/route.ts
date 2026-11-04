import { NextResponse } from "next/server";
import { z } from "zod";
import { getPublicSupabase } from "@/lib/supabase/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  if (!rateLimit(`nl:${clientIp(req)}`, 5, 60_000)) return NextResponse.json({ error: "Trop de tentatives." }, { status: 429 });
  const parsed = z.object({ email: z.string().trim().toLowerCase().email().max(160) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Adresse e-mail invalide." }, { status: 400 });
  const sb = getPublicSupabase();
  if (!sb) return NextResponse.json({ error: "Service momentanément indisponible." }, { status: 503 });
  const { error } = await sb.from("newsletter_subscribers").insert({ email: parsed.data.email });
  if (error && error.code !== "23505") return NextResponse.json({ error: "Inscription impossible." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
