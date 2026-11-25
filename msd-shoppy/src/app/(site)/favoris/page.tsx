import type { Metadata } from "next";
import { FavoritesView } from "@/components/cart/FavoritesView";
import { ShopCard } from "@/components/shop/ShopCard";
import { getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import type { Shop } from "@/lib/types";

export const metadata: Metadata = { title: "Favoris", robots: { index: false } };

export default async function FavoritesPage() {
  const user = await getUser();
  let shops: Shop[] = [];
  if (user) {
    const sb = await supabaseServer();
    const { data } = await sb.from("favorite_shops").select("shop:shops(*)").order("created_at", { ascending: false });
    shops = ((data ?? []) as unknown as { shop: Shop | null }[]).map((r) => r.shop).filter(Boolean) as Shop[];
  }
  return (
    <div className="container-page py-6 md:py-10">
      <h1 className="mb-6 text-2xl font-bold md:text-3xl">Favoris</h1>
      {shops.length > 0 && (
        <section className="mb-8"><h2 className="mb-3 text-lg font-semibold">Boutiques suivies</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{shops.map((s) => <li key={s.id}><ShopCard shop={s} /></li>)}</ul></section>
      )}
      <section><h2 className="mb-3 text-lg font-semibold">Produits</h2><FavoritesView signedIn={Boolean(user)} /></section>
    </div>
  );
}
