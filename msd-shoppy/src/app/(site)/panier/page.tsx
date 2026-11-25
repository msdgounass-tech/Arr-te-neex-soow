import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = { title: "Panier", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="container-page py-6 md:py-10">
      <h1 className="mb-6 text-2xl font-bold md:text-3xl">Panier</h1>
      <CartView />
    </div>
  );
}
