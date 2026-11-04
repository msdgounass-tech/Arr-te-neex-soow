import { NextResponse } from "next/server";
import { z } from "zod";
import { getPublicSupabase } from "@/lib/supabase/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({ variantIds: z.array(z.string().uuid()).max(50) });

/** Prix, stock et disponibilité actuels des articles du panier (source : base de données). */
export async function POST(req: Request) {
  if (!rateLimit(`cart:${clientIp(req)}`, 30, 60_000)) return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  const sb = getPublicSupabase();
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  // Base indisponible : on ne renvoie rien d'exploitable pour ne jamais vider un panier à tort.
  if (!sb) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });
  if (!parsed.data.variantIds.length) return NextResponse.json({ items: [] });

  const { data, error } = await sb
    .from("product_variants")
    .select("id, size, color, is_active, price_override, inventory(quantity), product:products(id, name, slug, reference, price, is_active, product_images(url, position))")
    .in("id", parsed.data.variantIds);
  if (error) return NextResponse.json({ error: "Vérification impossible." }, { status: 500 });

  type Row = {
    id: string; size: string | null; color: string | null; is_active: boolean; price_override: number | null;
    inventory: { quantity: number } | null;
    product: { id: string; name: string; slug: string; reference: string; price: number; is_active: boolean; product_images: { url: string; position: number }[] } | null;
  };
  const items = ((data || []) as unknown as Row[]).map((v) => ({
    variantId: v.id,
    available: Boolean(v.is_active && v.product?.is_active),
    unitPrice: v.price_override ?? v.product?.price ?? 0,
    stock: v.inventory?.quantity ?? 0,
    name: v.product?.name ?? "",
    slug: v.product?.slug ?? "",
    reference: v.product?.reference ?? "",
    image: [...(v.product?.product_images || [])].sort((a, b) => a.position - b.position)[0]?.url ?? null,
    size: v.size,
    color: v.color,
  }));
  return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
}
