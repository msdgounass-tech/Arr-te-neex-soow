import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";
import { getPublicSupabase } from "@/lib/supabase/server";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const statics = ["", "/shop", "/men", "/women", "/accessories", "/montres", "/chaussures", "/collections", "/nouveautes", "/meilleures-ventes", "/promotions", "/contact", "/livraison"].map((p) => ({
    url: `${SITE_URL}${p}`,
    changeFrequency: "daily" as const,
    priority: p === "" ? 1 : 0.8,
  }));
  const sb = getPublicSupabase();
  if (!sb) return statics;
  const [{ data: products }, { data: collections }] = await Promise.all([
    sb.from("products").select("slug, updated_at").eq("is_active", true).limit(5000),
    sb.from("collections").select("slug").eq("is_active", true),
  ]);
  return [
    ...statics,
    ...(products || []).map((p) => ({ url: `${SITE_URL}/produit/${p.slug}`, lastModified: p.updated_at, priority: 0.7 })),
    ...(collections || []).map((c) => ({ url: `${SITE_URL}/collections/${c.slug}`, priority: 0.6 })),
  ];
}
