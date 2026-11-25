"use client";
import { createPersistentStore } from "./createStore";

export interface CartLine {
  productId: string; variantId: string | null; quantity: number;
  // Instantané pour l'affichage uniquement : le serveur relit prix et stock à la commande.
  title: string; slug: string; price: number; image: string | null; variantLabel: string | null;
  shopId: string; shopName: string; shopSlug: string; maxQuantity: number | null;
}

const { store, useStore } = createPersistentStore<CartLine[]>("msd-cart-v1", []);
export const useCart = useStore;
const same = (a: CartLine, productId: string, variantId: string | null) => a.productId === productId && a.variantId === variantId;

export const cart = {
  add(line: CartLine) {
    store.set((lines) => {
      const existing = lines.find((l) => same(l, line.productId, line.variantId));
      if (!existing) return [...lines, { ...line, quantity: clamp(line.quantity, line.maxQuantity) }];
      return lines.map((l) => same(l, line.productId, line.variantId) ? { ...l, ...line, quantity: clamp(l.quantity + line.quantity, line.maxQuantity) } : l);
    });
  },
  setQuantity(productId: string, variantId: string | null, quantity: number) {
    store.set((lines) => quantity <= 0 ? lines.filter((l) => !same(l, productId, variantId))
      : lines.map((l) => same(l, productId, variantId) ? { ...l, quantity: clamp(quantity, l.maxQuantity) } : l));
  },
  remove(productId: string, variantId: string | null) { store.set((lines) => lines.filter((l) => !same(l, productId, variantId))); },
  removeShop(shopId: string) { store.set((lines) => lines.filter((l) => l.shopId !== shopId)); },
  clear() { store.set([]); },
};

function clamp(q: number, max: number | null) { return Math.max(1, Math.min(99, max ?? 99, q)); }

export function groupByShop(lines: CartLine[]) {
  const map = new Map<string, { shopId: string; shopName: string; shopSlug: string; lines: CartLine[]; subtotal: number }>();
  for (const l of lines) {
    const g = map.get(l.shopId) ?? { shopId: l.shopId, shopName: l.shopName, shopSlug: l.shopSlug, lines: [], subtotal: 0 };
    g.lines.push(l); g.subtotal += l.price * l.quantity; map.set(l.shopId, g);
  }
  return [...map.values()];
}
