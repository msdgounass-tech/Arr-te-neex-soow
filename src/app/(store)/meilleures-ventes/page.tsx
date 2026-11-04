import type { Metadata } from "next";
import { getBestSellers } from "@/lib/queries";
import { ProductGrid } from "@/components/product/ProductGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = { title: "Meilleures ventes" };
export const revalidate = 300;

export default async function BestSellersPage() {
  const products = await getBestSellers(24);
  return (
    <div className="container-luxe">
      <header className="pb-14 pt-16 text-center md:pt-24">
        <Reveal>
          <p className="eyebrow">Les plus convoitées</p>
          <h1 className="display mt-5 text-5xl md:text-8xl">Meilleures ventes</h1>
          <p className="mx-auto mt-6 max-w-xl text-ivory/65">Classement établi à partir des commandes passées sur la boutique.</p>
        </Reveal>
      </header>
      {products.length ? (
        <ProductGrid products={products} />
      ) : (
        <EmptyState title="Classement à venir" text="Le classement des meilleures ventes s'affichera dès les premières commandes." cta={{ href: "/nouveautes", label: "Voir les nouveautés" }} />
      )}
    </div>
  );
}
