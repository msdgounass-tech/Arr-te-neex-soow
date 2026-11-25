"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { cart, type CartLine } from "@/lib/store/cart";
import { isSupabaseConfigured } from "@/lib/env";

/** Revérifie prix, stock et disponibilité auprès de la base. Retourne les lignes devenues indisponibles. */
export function useCartCheck(lines: CartLine[]) {
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const key = lines.map((l) => `${l.productId}:${l.variantId}`).join(",");
  useEffect(() => {
    if (!isSupabaseConfigured || !lines.length) { setChecked(true); return; }
    let alive = true;
    (async () => {
      const ids = [...new Set(lines.map((l) => l.productId))];
      const { data } = await supabaseBrowser().from("products").select("id, title, price, status, availability, stock, variants:product_variants(id, price, stock, active)").in("id", ids);
      if (!alive) return;
      type Row = { id: string; price: number; status: string; availability: string; stock: number | null; variants: { id: string; price: number | null; stock: number | null; active: boolean }[] };
      const byId = new Map(((data ?? []) as unknown as Row[]).map((p) => [p.id, p]));
      const next: Record<string, string> = {};
      for (const l of lines) {
        const k = `${l.productId}:${l.variantId}`;
        const p = byId.get(l.productId);
        if (!p || p.status !== "published") { next[k] = "Ce produit n'est plus disponible."; continue; }
        if (p.availability === "out_of_stock") { next[k] = "Rupture de stock."; continue; }
        const v = l.variantId ? p.variants.find((x) => x.id === l.variantId && x.active) : null;
        if (l.variantId && !v) { next[k] = "Cette option n'est plus disponible."; continue; }
        const price = v?.price ?? p.price;
        const stock = v ? v.stock : p.stock;
        if (price !== l.price || stock !== l.maxQuantity) {
          cart.add({ ...l, quantity: 0, price, maxQuantity: stock });
          if (price !== l.price) next[k] = `Le prix a changé : il est maintenant de ${new Intl.NumberFormat("fr-FR").format(price)} FCFA.`;
        }
        if (stock != null && stock < l.quantity) next[k] = stock === 0 ? "Rupture de stock." : `Seulement ${stock} disponible${stock > 1 ? "s" : ""}.`;
      }
      setIssues(next); setChecked(true);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return { issues, checked };
}
