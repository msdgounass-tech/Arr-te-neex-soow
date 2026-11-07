import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";
import { getPublicSupabase } from "@/lib/supabase/server";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const statics = ["", "/shop", "/nouveautes", "/meilleures-ventes", "/promotions", "/collections", "/faq", "/livraison", "/garanties", "/contact", "/conditions", "/confidentialite"].map((p) => ({
    url: `${SITE_URL}${p}`,
    changeFrequency: "daily" as const,
    priority: p === "" ? 1 : ["/shop", "/nouveautes", "/promotions"].includes(p) ? 0.8 : 0.5,
  }));
  const sb = getPublicSupabase();
  if (!sb) return statics;
  const [{ data: products }, { data: collections }, { data: categories }] = await Promise.all([
    sb.from("products").select("slug, updated_at").eq("is_active", true).limit(5000),
    sb.from("collections").select("slug").eq("is_active", true),
    sb.from("categories").select("slug").eq("is_active", true),
  ]);
  return [
    ...statics,
    ...(products || []).map((p) => ({ url: `${SITE_URL}/produit/${p.slug}`, lastModified: p.updated_at, priority: 0.7 })),
    ...(categories || []).map((c) => ({ url: `${SITE_URL}/categorie/${c.slug}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...(collections || []).map((c) => ({ url: `${SITE_URL}/collections/${c.slug}`, priority: 0.6 })),
  ];
}
