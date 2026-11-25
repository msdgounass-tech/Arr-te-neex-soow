"use client";
import { useEffect, useState } from "react";
import { useFavorites } from "@/lib/store/favorites";
import { fetchCards } from "@/lib/cards-client";
import { ProductGrid } from "@/components/product/ProductCard";
import { EmptyState } from "@/components/ui/bits";
import type { ProductCardData } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/env";

export function FavoritesView({ signedIn }: { signedIn: boolean }) {
  const { products } = useFavorites();
  const [items, setItems] = useState<ProductCardData[] | null>(null);
  const key = products.join(",");
  useEffect(() => {
    if (!isSupabaseConfigured) { setItems([]); return; }
    let alive = true;
    void fetchCards(key ? key.split(",") : []).then((r) => alive && setItems(r));
    return () => { alive = false; };
  }, [key]);
  if (items === null) return <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <li key={i} className="skeleton aspect-[4/5] rounded-2xl" />)}</ul>;
  const visible = items.filter((p) => products.includes(p.id));
  if (!visible.length) return <EmptyState icon="heart" title="Aucun produit en favori" text="Touchez le cœur sur un produit pour le retrouver ici." action={{ href: "/explorer", label: "Explorer le catalogue" }} />;
  return (
    <>
      {!signedIn && <p className="mb-4 rounded-2xl bg-mist p-3 text-sm text-slate">Vos favoris sont enregistrés sur cet appareil. <a href="/connexion?suite=/favoris" className="link">Connectez-vous</a> pour les retrouver partout.</p>}
      <ProductGrid items={visible} />
    </>
  );
}
