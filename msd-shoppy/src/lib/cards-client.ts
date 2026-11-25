"use client";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { ProductCardData, ProductImage } from "@/lib/types";

/** Version navigateur de getProductCardsByIds (favoris des visiteurs). */
export async function fetchCards(ids: string[]): Promise<ProductCardData[]> {
  if (!ids.length) return [];
  const { data } = await supabaseBrowser().from("products")
    .select("id, slug, title, price, compare_at_price, availability, shop:shops!inner(id, slug, name, city), images:product_images(id, product_id, url, width, height, position)")
    .in("id", ids);
  const rows = (data ?? []) as unknown as (Omit<ProductCardData, "image"> & { images: ProductImage[] })[];
  const byId = new Map(rows.map((r) => [r.id, { ...r, image: r.images.sort((a, b) => a.position - b.position)[0] ?? null }]));
  return ids.map((id) => byId.get(id)).filter(Boolean) as ProductCardData[];
}
