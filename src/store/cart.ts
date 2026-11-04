"use client";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { browserStorage } from "./storage";

export interface CartLine {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  reference: string;
  image: string | null;
  size: string | null;
  color: string | null;
  unitPrice: number;
  quantity: number;
  maxStock: number;
}

export interface AppliedCoupon {
  code: string;
  discount: number;
  message: string;
  subtotal: number;
}

interface CartState {
  lines: CartLine[];
  coupon: AppliedCoupon | null;
  open: boolean;
  add: (line: CartLine) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  replace: (lines: CartLine[]) => void;
  setCoupon: (c: AppliedCoupon | null) => void;
  setOpen: (open: boolean) => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      coupon: null,
      open: false,
      add: (line) =>
        set((s) => {
          const existing = s.lines.find((l) => l.variantId === line.variantId);
          const lines = existing
            ? s.lines.map((l) =>
                l.variantId === line.variantId
                  ? { ...l, ...line, quantity: Math.min(l.quantity + line.quantity, line.maxStock, 99) }
                  : l,
              )
            : [...s.lines, { ...line, quantity: Math.min(line.quantity, line.maxStock, 99) }];
          return { lines, coupon: null, open: true };
        }),
      setQuantity: (variantId, quantity) =>
        set((s) => ({
          lines: s.lines.map((l) =>
            l.variantId === variantId ? { ...l, quantity: Math.max(1, Math.min(quantity, l.maxStock || 99, 99)) } : l,
          ),
          coupon: null,
        })),
      remove: (variantId) => set((s) => ({ lines: s.lines.filter((l) => l.variantId !== variantId), coupon: null })),
      clear: () => set({ lines: [], coupon: null }),
      replace: (lines) => set({ lines, coupon: null }),
      setCoupon: (coupon) => set({ coupon }),
      setOpen: (open) => set({ open }),
    }),
    {
      name: "gl-cart-v1",
      storage: createJSONStorage(browserStorage),
      partialize: (s) => ({ lines: s.lines, coupon: s.coupon }),
    },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((a, l) => a + l.quantity, 0);
export const cartSubtotal = (lines: CartLine[]) => lines.reduce((a, l) => a + l.unitPrice * l.quantity, 0);
