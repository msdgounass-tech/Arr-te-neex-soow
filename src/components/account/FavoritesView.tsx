"use client";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/types";
import { useFavorites } from "@/store/favorites";
import { useHydrated } from "@/hooks/useHydrated";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductCardClient } from "@/components/product/ProductCardClient";

export function FavoritesView() {
  const hydrated = useHydrated();
  const ids = useFavorites((s) => s.ids);
  const [items, setItems] = useState<Product[] | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!ids.length) return setItems([]);
    fetch(`/api/products?ids=${ids.join(",")}`)
      .then((r) => r.json())
      .then((j) => setItems(j.items || []))
      .catch(() => setItems([]));
  }, [ids, hydrated]);

  return (
    <div className="container-luxe pt-16 md:pt-24">
      <header className="mb-14 text-center">
        <p className="eyebrow">Votre sélection</p>
        <h1 className="display mt-5 text-5xl md:text-7xl">Favoris</h1>
      </header>
      {items === null ? (
        <p className="text-center text-sm text-mist">Chargement…</p>
      ) : items.length === 0 ? (
        <EmptyState title="Aucun favori" text="Touchez le cœur sur un produit pour le retrouver ici." cta={{ href: "/shop", label: "Explorer la boutique" }} />
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
          {items.filter((p) => ids.includes(p.id)).map((p) => <ProductCardClient key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
