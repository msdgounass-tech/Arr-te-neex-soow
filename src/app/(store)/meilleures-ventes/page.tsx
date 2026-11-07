import type { Metadata } from "next";
import { getBestSellers } from "@/lib/queries";
import { ProductGrid } from "@/components/product/ProductGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = { title: "Meilleures ventes", description: "Les produits high-tech les plus commandés sur la boutique.", alternates: { canonical: "/meilleures-ventes" } };
export const revalidate = 300;

export default async function BestSellersPage() {
  const products = await getBestSellers(24);
  return (
    <div className="container-luxe">
      <header className="pb-10 pt-10 md:pb-14 md:pt-16">
        <Reveal>
          <p className="eyebrow">Les plus demandés</p>
          <h1 className="display mt-4 text-[2.6rem] sm:text-6xl md:text-7xl">Meilleures ventes</h1>
          <p className="mt-4 max-w-xl text-ivory/80">Classement établi à partir des commandes passées sur la boutique.</p>
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
