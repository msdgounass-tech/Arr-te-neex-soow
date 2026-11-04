import { NextResponse } from "next/server";
import { z } from "zod";
import { getPublicSupabase } from "@/lib/supabase/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  subject: z.string().trim().max(160).optional().or(z.literal("")),
  message: z.string().trim().min(5).max(3000),
});

export async function POST(req: Request) {
  if (!rateLimit(`contact:${clientIp(req)}`, 4, 60_000)) return NextResponse.json({ error: "Trop de messages. Patientez une minute." }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Merci de compléter correctement le formulaire." }, { status: 400 });
  if (!parsed.data.email && !parsed.data.phone) return NextResponse.json({ error: "Indiquez un e-mail ou un téléphone." }, { status: 400 });
  const sb = getPublicSupabase();
  if (!sb) return NextResponse.json({ error: "Service momentanément indisponible." }, { status: 503 });
  const { error } = await sb.from("contact_messages").insert({ ...parsed.data, email: parsed.data.email || null, phone: parsed.data.phone || null });
  if (error) return NextResponse.json({ error: "Envoi impossible." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
