"use client";
import { useEffect, useRef, useState } from "react";
import { useCart, type CartLine } from "@/store/cart";

interface Fresh {
  variantId: string; available: boolean; unitPrice: number; stock: number;
  name: string; slug: string; reference: string; image: string | null; size: string | null; color: string | null;
}

/**
 * Resynchronise le panier local avec la base : prix actuels, stock, articles retirés.
 * Garantit que le montant affiché correspond à celui que le serveur enregistrera.
 */
export function useCartValidation(enabled = true) {
  const lines = useCart((s) => s.lines);
  const replace = useCart((s) => s.replace);
  const [notice, setNotice] = useState("");
  const [checking, setChecking] = useState(false);
  const lastKey = useRef("");

  useEffect(() => {
    if (!enabled || !lines.length) return;
    const key = lines.map((l) => l.variantId).sort().join(",");
    if (key === lastKey.current) return;
    lastKey.current = key;
    const ctrl = new AbortController();
    setChecking(true);
    fetch("/api/cart/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantIds: lines.map((l) => l.variantId) }),
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json: { items: Fresh[] } | null) => {
        if (!json) return;
        const current = useCart.getState().lines;
        const map = new Map(json.items.map((i) => [i.variantId, i]));
        const messages: string[] = [];
        const next: CartLine[] = [];
        for (const l of current) {
          const f = map.get(l.variantId);
          if (!f || !f.available || f.stock < 1) {
            messages.push(`« ${l.name} » n'est plus disponible et a été retiré.`);
            continue;
          }
          const quantity = Math.min(l.quantity, f.stock);
          if (f.unitPrice !== l.unitPrice) messages.push(`Le prix de « ${f.name} » a été mis à jour.`);
          if (quantity !== l.quantity) messages.push(`Quantité de « ${f.name} » ajustée au stock disponible (${f.stock}).`);
          next.push({ ...l, name: f.name, slug: f.slug, reference: f.reference, image: f.image ?? l.image, size: f.size, color: f.color, unitPrice: f.unitPrice, maxStock: f.stock, quantity });
        }
        const changed = JSON.stringify(next) !== JSON.stringify(current);
        if (changed) {
          lastKey.current = next.map((l) => l.variantId).sort().join(",");
          replace(next);
        }
        setNotice(messages.join(" "));
      })
      .catch(() => {})
      .finally(() => setChecking(false));
    return () => ctrl.abort();
  }, [enabled, lines, replace]);

  return { notice, checking };
}
