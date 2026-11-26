import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { isSupabaseConfigured } from "@/lib/env";
import { supabasePublic } from "@/lib/supabase/public";
import { ARTICLES } from "@/lib/help";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = [
    { url: `${SITE.url}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE.url}/explorer`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE.url}/vendre`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE.url}/aide`, changeFrequency: "monthly", priority: 0.4 },
    ...ARTICLES.map((a) => ({ url: `${SITE.url}/aide/${a.slug}`, changeFrequency: "monthly" as const, priority: 0.3 })),
  ];
  if (!isSupabaseConfigured) return base;
  const sb = supabasePublic();
  const [{ data: products }, { data: shops }] = await Promise.all([
    sb.from("products").select("slug, updated_at").eq("status", "published").order("updated_at", { ascending: false }).limit(5000),
    sb.from("shops").select("slug, updated_at").limit(5000),
  ]);
  return [...base,
    ...(shops ?? []).map((s: { slug: string; updated_at: string }) => ({ url: `${SITE.url}/b/${s.slug}`, lastModified: s.updated_at, priority: 0.7 })),
    ...(products ?? []).map((p: { slug: string; updated_at: string }) => ({ url: `${SITE.url}/p/${p.slug}`, lastModified: p.updated_at, priority: 0.8 })),
  ];
}
