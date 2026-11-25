"use client";
import { supabaseBrowser } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import type { EventType } from "@/lib/types";

/** Enregistre une interaction réelle (au plus une fois par session pour les consultations). */
export function track(shopId: string, type: EventType, productId?: string) {
  if (!isSupabaseConfigured) return;
  if (type === "shop_view" || type === "product_view") {
    const key = `msd-seen:${type}:${productId ?? shopId}`;
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, "1"); } catch { /* navigation privée */ }
  }
  void supabaseBrowser().rpc("track_event", { p_shop: shopId, p_type: type, p_product: productId ?? null });
}
