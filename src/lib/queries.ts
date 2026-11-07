import "server-only";
import { cache } from "react";
import { getPublicSupabase } from "./supabase/server";
import type { Category, CategoryNode, Collection, DeliverySettings, DeliveryZone, Gender, HomeSettings, PaymentSettings, Product, StoreSettings } from "./types";
import { EMPTY_DELIVERY, EMPTY_HOME, EMPTY_PAYMENTS, EMPTY_STORE } from "./site";

export const PRODUCT_SELECT = `
  id, name, slug, reference, description, details, gender, price, compare_at_price, is_featured, is_new, is_active,
  created_at, category_id, collection_id, seo_title, seo_description, tags, brand, specs,
  category:categories(id, name, slug, gender, parent_id),
  collection:collections(id, name, slug),
  product_images(id, url, alt, position),
  product_variants(id, size, color, color_hex, sku, price_override, position, is_active, inventory(quantity))
`;

export const PAGE_SIZE = 24;

export type SortKey = "recent" | "price-asc" | "price-desc" | "name";

export interface ProductFilters {
  gender?: Gender;
  categorySlugs?: string[];
  accessoriesOnly?: boolean;
  collectionSlug?: string;
  onSale?: boolean;
  isNew?: boolean;
  featured?: boolean;
  q?: string;
  min?: number;
  max?: number;
  sort?: SortKey;
  page?: number;
  limit?: number;
  ids?: string[];
  excludeId?: string;
  tag?: string;
  brand?: string;
}

const clean = (q: string) => q.replace(/[%,()*\\'"]/g, " ").trim().slice(0, 60);

export async function getProducts(f: ProductFilters = {}): Promise<{ items: Product[]; count: number }> {
  const sb = getPublicSupabase();
  if (!sb) return { items: [], count: 0 };

  let categoryIds: string[] | undefined;
  if (f.categorySlugs?.length || f.accessoriesOnly) {
    let cq = sb.from("categories").select("id");
    if (f.categorySlugs?.length) cq = cq.in("slug", f.categorySlugs);
    if (f.accessoriesOnly) cq = cq.eq("is_accessory", true);
    const { data } = await cq;
    categoryIds = (data || []).map((c) => c.id as string);
    if (!categoryIds.length) return { items: [], count: 0 };
  }
  let collectionId: string | undefined;
  if (f.collectionSlug) {
    const { data } = await sb.from("collections").select("id").eq("slug", f.collectionSlug).maybeSingle();
    if (!data) return { items: [], count: 0 };
    collectionId = data.id;
  }

  const limit = f.limit ?? PAGE_SIZE;
  const page = Math.max(1, f.page ?? 1);
  let q = sb.from("products").select(PRODUCT_SELECT, { count: "exact" }).eq("is_active", true);
  if (f.gender) q = q.in("gender", [f.gender, "unisexe"]);
  if (categoryIds) q = q.in("category_id", categoryIds);
  if (collectionId) q = q.eq("collection_id", collectionId);
  if (f.onSale) q = q.not("compare_at_price", "is", null);
  if (f.isNew) q = q.eq("is_new", true);
  if (f.featured) q = q.eq("is_featured", true);
  if (f.ids) q = q.in("id", f.ids.length ? f.ids : ["00000000-0000-0000-0000-000000000000"]);
  if (f.excludeId) q = q.neq("id", f.excludeId);
  if (f.tag) q = q.contains("tags", [f.tag]);
  if (f.brand) q = q.ilike("brand", clean(f.brand));
  if (f.min) q = q.gte("price", f.min);
  if (f.max) q = q.lte("price", f.max);
  if (f.q) {
    const term = clean(f.q);
    if (term) q = q.or(`name.ilike.%${term}%,brand.ilike.%${term}%,description.ilike.%${term}%,reference.ilike.%${term}%`);
  }
  switch (f.sort) {
    case "price-asc":
      q = q.order("price", { ascending: true });
      break;
    case "price-desc":
      q = q.order("price", { ascending: false });
      break;
    case "name":
      q = q.order("name", { ascending: true });
      break;
    default:
      q = q.order("created_at", { ascending: false });
  }
  q = q.range((page - 1) * limit, page * limit - 1);

  const { data, count, error } = await q;
  if (error) {
    console.error("[getProducts]", error.message);
    return { items: [], count: 0 };
  }
  let items = (data || []) as unknown as Product[];
  if (f.onSale) items = items.filter((p) => p.compare_at_price != null && p.compare_at_price > p.price);
  return { items, count: count ?? items.length };
}

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  const sb = getPublicSupabase();
  if (!sb) return null;
  const { data } = await sb.from("products").select(PRODUCT_SELECT).eq("slug", slug).eq("is_active", true).maybeSingle();
  return (data as unknown as Product) || null;
});

export async function getBestSellers(limit = 8): Promise<Product[]> {
  const sb = getPublicSupabase();
  if (!sb) return [];
  const { data } = await sb.rpc("best_seller_ids", { p_limit: limit });
  const ids = ((data as string[] | null) || []).filter(Boolean);
  if (!ids.length) return [];
  const { items } = await getProducts({ ids, limit });
  return ids.map((id) => items.find((p) => p.id === id)).filter(Boolean) as Product[];
}

export const getCategories = cache(async (): Promise<Category[]> => {
  const sb = getPublicSupabase();
  if (!sb) return [];
  const { data } = await sb.from("categories").select("*").eq("is_active", true).order("position");
  return (data || []) as Category[];
});

/** Univers (catégories parentes) et leurs types, sans les univers vides de sous-catégories actives. */
export const getCategoryTree = cache(async (): Promise<CategoryNode[]> => {
  const all = await getCategories();
  return all
    .filter((c) => !c.parent_id)
    .map((p) => ({ ...p, children: all.filter((c) => c.parent_id === p.id) }))
    .filter((p) => p.children.length > 0);
});

/** Catégorie par slug, avec la liste des slugs à inclure (elle-même + ses sous-catégories). */
export const getCategoryBySlug = cache(async (slug: string) => {
  const all = await getCategories();
  const cat = all.find((c) => c.slug === slug);
  if (!cat) return null;
  const children = all.filter((c) => c.parent_id === cat.id);
  const parent = cat.parent_id ? all.find((c) => c.id === cat.parent_id) || null : null;
  const siblings = parent ? all.filter((c) => c.parent_id === parent.id) : children;
  return { category: cat, parent, children, siblings, slugs: [cat.slug, ...children.map((c) => c.slug)] };
});

/** Nombre de produits en ligne par catégorie (slug) — les univers cumulent leurs sous-catégories. */
export const getCategoryCounts = cache(async (): Promise<Record<string, number>> => {
  const sb = getPublicSupabase();
  if (!sb) return {};
  const [all, { data }] = await Promise.all([getCategories(), sb.from("products").select("category_id").eq("is_active", true).limit(5000)]);
  const byId: Record<string, number> = {};
  (data || []).forEach((r) => {
    if (r.category_id) byId[r.category_id as string] = (byId[r.category_id as string] || 0) + 1;
  });
  const out: Record<string, number> = {};
  all.forEach((c) => {
    const own = byId[c.id] || 0;
    out[c.slug] = (out[c.slug] || 0) + own;
    const parent = c.parent_id ? all.find((p) => p.id === c.parent_id) : null;
    if (parent) out[parent.slug] = (out[parent.slug] || 0) + own;
  });
  return out;
});

/** Marques présentes dans le catalogue en ligne (pour le filtre « Marque »). */
export const getBrands = cache(async (): Promise<string[]> => {
  const sb = getPublicSupabase();
  if (!sb) return [];
  const { data } = await sb.from("products").select("brand").eq("is_active", true).not("brand", "is", null).limit(2000);
  const set = new Map<string, string>();
  (data || []).forEach((r) => {
    const b = String(r.brand || "").trim();
    if (b && !set.has(b.toLowerCase())) set.set(b.toLowerCase(), b);
  });
  return [...set.values()].sort((a, b) => a.localeCompare(b, "fr"));
});

export const getCollections = cache(async (): Promise<Collection[]> => {
  const sb = getPublicSupabase();
  if (!sb) return [];
  const { data } = await sb.from("collections").select("*").eq("is_active", true).order("position");
  return (data || []) as Collection[];
});

export async function getCollectionBySlug(slug: string): Promise<Collection | null> {
  const sb = getPublicSupabase();
  if (!sb) return null;
  const { data } = await sb.from("collections").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
  return (data as Collection) || null;
}

export const getDeliveryZones = cache(async (): Promise<DeliveryZone[]> => {
  const sb = getPublicSupabase();
  if (!sb) return [];
  const { data } = await sb.from("delivery_zones").select("*").eq("is_active", true).order("position");
  return (data || []) as DeliveryZone[];
});

export interface AllSettings {
  store: StoreSettings;
  home: HomeSettings;
  delivery: DeliverySettings;
  payments: PaymentSettings;
}

export const getSettings = cache(async (): Promise<AllSettings> => {
  const sb = getPublicSupabase();
  if (!sb) return { store: EMPTY_STORE, home: EMPTY_HOME, delivery: EMPTY_DELIVERY, payments: EMPTY_PAYMENTS };
  const { data } = await sb.from("settings").select("key, value").in("key", ["store", "home", "delivery", "payments"]);
  const map = Object.fromEntries((data || []).map((r) => [r.key, r.value]));
  return {
    store: { ...EMPTY_STORE, ...(map.store || {}) },
    home: { ...EMPTY_HOME, ...(map.home || {}) },
    delivery: { ...EMPTY_DELIVERY, ...(map.delivery || {}) },
    payments: { ...EMPTY_PAYMENTS, ...(map.payments || {}) },
  };
});
