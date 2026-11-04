import { NextResponse } from "next/server";
import { z } from "zod";
import { getPublicSupabase } from "@/lib/supabase/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({ code: z.string().trim().min(1).max(40), subtotal: z.number().int().min(0) });

export async function POST(req: Request) {
  if (!rateLimit(`coupon:${clientIp(req)}`, 12, 60_000)) return NextResponse.json({ valid: false, message: "Trop de tentatives." }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  const sb = getPublicSupabase();
  if (!parsed.success || !sb) return NextResponse.json({ valid: false, message: "Code invalide." });
  const { data, error } = await sb.rpc("validate_coupon", { p_code: parsed.data.code, p_subtotal: parsed.data.subtotal });
  if (error) return NextResponse.json({ valid: false, message: "Vérification impossible." });
  return NextResponse.json(data);
}
