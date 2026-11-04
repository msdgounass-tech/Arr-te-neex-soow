"use client";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { browserStorage } from "./storage";
import { getBrowserSupabase } from "@/lib/supabase/client";

interface FavState {
  ids: string[];
  userId: string | null;
  toggle: (productId: string) => Promise<boolean>;
  has: (productId: string) => boolean;
  hydrateForUser: (userId: string | null) => Promise<void>;
}

/** Favoris : stockés localement pour les visiteurs, synchronisés avec Supabase une fois connecté. */
export const useFavorites = create<FavState>()(
  persist(
    (set, get) => ({
      ids: [],
      userId: null,
      has: (id) => get().ids.includes(id),
      toggle: async (id) => {
        const on = !get().ids.includes(id);
        set((s) => ({ ids: on ? [...s.ids, id] : s.ids.filter((x) => x !== id) }));
        const sb = getBrowserSupabase();
        const uid = get().userId;
        if (sb && uid) {
          const { error } = on
            ? await sb.from("favorites").upsert({ user_id: uid, product_id: id })
            : await sb.from("favorites").delete().eq("user_id", uid).eq("product_id", id);
          if (error) console.error("[favoris]", error.message);
        }
        return on;
      },
      hydrateForUser: async (userId) => {
        const prev = get().userId;
        set({ userId });
        const sb = getBrowserSupabase();
        if (!sb || !userId) {
          if (prev && !userId) set({ ids: [] });
          return;
        }
        const local = get().ids;
        if (local.length) {
          await sb.from("favorites").upsert(local.map((product_id) => ({ user_id: userId, product_id })), { ignoreDuplicates: true });
        }
        const { data } = await sb.from("favorites").select("product_id").eq("user_id", userId);
        set({ ids: (data || []).map((r) => r.product_id as string) });
      },
    }),
    { name: "gl-favorites-v1",
      storage: createJSONStorage(browserStorage), partialize: (s) => ({ ids: s.ids }) },
  ),
);
