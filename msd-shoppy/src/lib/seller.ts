import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import type { ProgressFacts } from "@/lib/assistant";
import type { Shop, SellerStats } from "@/lib/types";

export async function getSellerOverview(shop: Shop) {
  const sb = await supabaseServer();
  const [orders, products, specs, progress, stats] = await Promise.all([
    sb.from("orders").select("status").eq("shop_id", shop.id),
    sb.from("products").select("status, availability, stock, quality_score").eq("shop_id", shop.id),
    sb.from("shop_specialties").select("category_id", { count: "exact", head: true }).eq("shop_id", shop.id),
    sb.from("assistant_progress").select("step_key, status"),
    sb.rpc("seller_stats", { p_days: 30 }),
  ]);
  const os = (orders.data ?? []) as { status: string }[];
  const ps = (products.data ?? []) as { status: string; availability: string; stock: number | null; quality_score: number }[];
  const published = ps.filter((p) => p.status === "published");
  const s = (stats.data ?? null) as SellerStats | null;
  const facts: ProgressFacts = {
    hasLogo: Boolean(shop.logo_url), descriptionLength: shop.description.trim().length,
    hasContact: Boolean(shop.public_phone || shop.public_whatsapp), hasLocation: Boolean(shop.region && shop.city),
    specialties: specs.count ?? 0, publishedProducts: published.length,
    averageQuality: published.length ? Math.round(published.reduce((a, p) => a + p.quality_score, 0) / published.length) : null,
    shares: s?.shares ?? 0,
  };
  return {
    orders: {
      pending: os.filter((o) => o.status === "pending").length,
      inProgress: os.filter((o) => ["confirmed", "preparing", "shipped", "delivered"].includes(o.status)).length,
      completed: os.filter((o) => o.status === "completed").length,
      cancelled: os.filter((o) => ["cancelled", "refused"].includes(o.status)).length,
    },
    products: {
      total: ps.length, published: published.length,
      unavailable: ps.filter((p) => p.status === "published" && (p.availability === "out_of_stock" || p.stock === 0)).length,
      drafts: ps.filter((p) => p.status !== "published").length, averageQuality: facts.averageQuality,
    },
    stats: s, facts,
    manual: Object.fromEntries(((progress.data ?? []) as { step_key: string; status: "done" | "dismissed" }[]).map((r) => [r.step_key, r.status])),
  };
}
