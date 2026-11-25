import "server-only";
import { cache } from "react";
import { supabasePublic } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/env";
import type { Category, Domain, Product, ProductCardData, ProductImage, ProductVariant, Region, Review, Shop, Trust, DeliveryZone } from "@/lib/types";

const CARD_SELECT = "id, slug, title, price, compare_at_price, availability, shop:shops!inner(id, slug, name, city), images:product_images(id, product_id, url, width, height, position)";

type RawCard = Omit<ProductCardData, "image"> & { images: ProductImage[] | null; shop: ProductCardData["shop"] | ProductCardData["shop"][] };
function toCard(r: RawCard): ProductCardData {
  const images = (r.images ?? []).slice().sort((a, b) => a.position - b.position);
  const shop = Array.isArray(r.shop) ? r.shop[0] : r.shop;
  return { id: r.id, slug: r.slug, title: r.title, price: r.price, compare_at_price: r.compare_at_price, availability: r.availability, image: images[0] ?? null, shop };
}

export const getDomains = cache(async (): Promise<Domain[]> => {
  if (!isSupabaseConfigured) return [];
  const { data } = await supabasePublic().from("domains").select("*").eq("active", true).order("position");
  return (data ?? []) as Domain[];
});

export const getCategories = cache(async (): Promise<Category[]> => {
  if (!isSupabaseConfigured) return [];
  const { data } = await supabasePublic().from("categories").select("*").eq("active", true).order("position");
  return (data ?? []) as Category[];
});

export const getRegions = cache(async (country = "SN"): Promise<Region[]> => {
  if (!isSupabaseConfigured) return [];
  const { data } = await supabasePublic().from("regions").select("*").eq("country_code", country).order("name");
  return (data ?? []) as Region[];
});

export async function getProductCardsByIds(ids: string[]): Promise<ProductCardData[]> {
  if (!isSupabaseConfigured || ids.length === 0) return [];
  const { data } = await supabasePublic().from("products").select(CARD_SELECT).in("id", ids);
  const byId = new Map(((data ?? []) as unknown as RawCard[]).map((r) => [r.id, toCard(r)]));
  return ids.map((id) => byId.get(id)).filter((x): x is ProductCardData => Boolean(x));
}

export interface SearchParams {
  q?: string; domain?: number; category?: number; min?: number; max?: number; region?: string; available?: boolean;
  shop?: string; sort?: "relevance" | "newest" | "price_asc" | "price_desc" | "popular"; page?: number; perPage?: number;
}

export async function searchProducts(p: SearchParams): Promise<{ items: ProductCardData[]; total: number }> {
  if (!isSupabaseConfigured) return { items: [], total: 0 };
  const perPage = p.perPage ?? 24;
  const { data, error } = await supabasePublic().rpc("search_products", {
    p_query: p.q ?? null, p_domain: p.domain ?? null, p_category: p.category ?? null, p_min_price: p.min ?? null,
    p_max_price: p.max ?? null, p_region: p.region ?? null, p_available: p.available ?? null, p_shop: p.shop ?? null,
    p_sort: p.sort ?? (p.q ? "relevance" : "newest"), p_limit: perPage, p_offset: ((p.page ?? 1) - 1) * perPage,
  });
  if (error || !data) return { items: [], total: 0 };
  const rows = data as { id: string; total_count: number }[];
  return { items: await getProductCardsByIds(rows.map((r) => r.id)), total: rows[0]?.total_count ?? 0 };
}

export async function searchShops(q?: string, domain?: number, region?: string, limit = 24): Promise<Shop[]> {
  if (!isSupabaseConfigured) return [];
  const { data } = await supabasePublic().rpc("search_shops", { p_query: q ?? null, p_domain: domain ?? null, p_region: region ?? null, p_limit: limit });
  return (data ?? []) as Shop[];
}

export interface ProductPage {
  product: Product; images: ProductImage[]; variants: ProductVariant[]; shop: Shop; category: Category | null; trust: Trust | null;
}

export async function getProductBySlug(slug: string): Promise<ProductPage | null> {
  if (!isSupabaseConfigured) return null;
  const sb = supabasePublic();
  const { data } = await sb.from("products")
    .select("*, images:product_images(*), variants:product_variants(*), shop:shops!inner(*), category:categories(*)")
    .eq("slug", slug).eq("status", "published").maybeSingle();
  if (!data) return null;
  const { images, variants, shop, category, ...product } = data as Product & { images: ProductImage[]; variants: ProductVariant[]; shop: Shop; category: Category | null };
  const { data: trust } = await sb.rpc("get_shop_trust", { p_shop: shop.id });
  return {
    product: product as Product,
    images: images.sort((a, b) => a.position - b.position),
    variants: variants.filter((v) => v.active).sort((a, b) => a.position - b.position),
    shop, category, trust: trust as Trust | null,
  };
}

export async function getShopBySlug(slug: string): Promise<{ shop: Shop; trust: Trust | null; zones: DeliveryZone[]; specialties: Category[] } | null> {
  if (!isSupabaseConfigured) return null;
  const sb = supabasePublic();
  const { data: shop } = await sb.from("shops").select("*").eq("slug", slug).maybeSingle();
  if (!shop) return null;
  const [{ data: trust }, { data: zones }, { data: specs }] = await Promise.all([
    sb.rpc("get_shop_trust", { p_shop: shop.id }),
    sb.from("shop_delivery_zones").select("*").eq("shop_id", shop.id).eq("active", true).order("created_at"),
    sb.from("shop_specialties").select("category:categories(*)").eq("shop_id", shop.id),
  ]);
  return {
    shop: shop as Shop, trust: trust as Trust | null, zones: (zones ?? []) as DeliveryZone[],
    specialties: ((specs ?? []) as unknown as { category: Category }[]).map((s) => s.category).filter(Boolean),
  };
}

export async function getShopReviews(shopId: string, limit = 10): Promise<Review[]> {
  if (!isSupabaseConfigured) return [];
  const { data } = await supabasePublic().from("reviews").select("*").eq("shop_id", shopId).order("created_at", { ascending: false }).limit(limit);
  return (data ?? []) as Review[];
}

export async function getTrustMap(shopIds: string[]): Promise<Record<string, Trust>> {
  if (!isSupabaseConfigured || shopIds.length === 0) return {};
  const sb = supabasePublic();
  const entries = await Promise.all([...new Set(shopIds)].map(async (id) => [id, (await sb.rpc("get_shop_trust", { p_shop: id })).data as Trust] as const));
  return Object.fromEntries(entries.filter(([, t]) => t));
}
