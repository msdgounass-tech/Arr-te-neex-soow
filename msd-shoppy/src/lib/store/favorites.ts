"use client";
import { createPersistentStore } from "./createStore";
import { supabaseBrowser } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";

/** Favoris : sur l'appareil pour les visiteurs, synchronisés avec le compte une fois connecté. */
const { store, useStore } = createPersistentStore<{ products: string[]; userId: string | null }>("msd-favs-v1", { products: [], userId: null });
export const useFavorites = useStore;

export const favorites = {
  has: (id: string) => store.get().products.includes(id),
  async toggle(productId: string, shopId: string): Promise<boolean> {
    const { userId, products } = store.get();
    const adding = !products.includes(productId);
    store.set((s) => ({ ...s, products: adding ? [productId, ...s.products] : s.products.filter((p) => p !== productId) }));
    if (userId && isSupabaseConfigured) {
      const sb = supabaseBrowser();
      const { error } = adding
        ? await sb.from("favorite_products").insert({ user_id: userId, product_id: productId })
        : await sb.from("favorite_products").delete().eq("user_id", userId).eq("product_id", productId);
      if (error && !/duplicate/.test(error.message)) {
        store.set((s) => ({ ...s, products: adding ? s.products.filter((p) => p !== productId) : [productId, ...s.products] }));
        throw error;
      }
    }
    if (adding && isSupabaseConfigured) void supabaseBrowser().rpc("track_event", { p_shop: shopId, p_type: "favorite_add", p_product: productId });
    return adding;
  },
  /** À la connexion : fusionne les favoris de l'appareil avec ceux du compte. */
  async syncWithAccount(userId: string | null) {
    if (!isSupabaseConfigured) return;
    if (!userId) { if (store.get().userId) store.set({ products: [], userId: null }); return; }
    const sb = supabaseBrowser();
    const local = store.get().userId === userId ? [] : store.get().products;
    if (local.length) await sb.from("favorite_products").upsert(local.map((p) => ({ user_id: userId, product_id: p })), { ignoreDuplicates: true });
    const { data } = await sb.from("favorite_products").select("product_id").eq("user_id", userId).order("created_at", { ascending: false });
    store.set({ products: (data ?? []).map((r: { product_id: string }) => r.product_id), userId });
  },
};
