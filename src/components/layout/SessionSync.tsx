"use client";
import { useEffect, useRef } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useFavorites } from "@/store/favorites";
import { useCart } from "@/store/cart";

/**
 * Synchronise favoris et panier avec Supabase pour les clients connectés
 * (tables favorites, carts, cart_items). Les visiteurs restent en stockage local.
 */
export function SessionSync() {
  const hydrateFav = useFavorites((s) => s.hydrateForUser);
  const userRef = useRef<string | null>(null);

  useEffect(() => {
    const sb = getBrowserSupabase();
    if (!sb) return;
    sb.auth.getUser().then(({ data }) => {
      userRef.current = data.user?.id ?? null;
      hydrateFav(userRef.current);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      const id = session?.user?.id ?? null;
      if (id !== userRef.current) {
        userRef.current = id;
        hydrateFav(id);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [hydrateFav]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsub = useCart.subscribe((state, prev) => {
      if (state.lines === prev.lines) return;
      clearTimeout(timer);
      timer = setTimeout(async () => {
        const sb = getBrowserSupabase();
        const uid = userRef.current;
        if (!sb || !uid) return;
        const { data: cart } = await sb.from("carts").upsert({ user_id: uid, updated_at: new Date().toISOString() }, { onConflict: "user_id" }).select("id").single();
        if (!cart) return;
        await sb.from("cart_items").delete().eq("cart_id", cart.id);
        if (state.lines.length) {
          await sb.from("cart_items").insert(state.lines.map((l) => ({ cart_id: cart.id, variant_id: l.variantId, quantity: l.quantity })));
        }
      }, 900);
    });
    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, []);

  return null;
}
