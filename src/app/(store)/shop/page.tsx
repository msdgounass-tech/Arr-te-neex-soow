import type { Metadata } from "next";
import { CatalogPage, type SearchParams } from "@/components/catalog/CatalogPage";
import { universeFilter } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Catalogue",
  description: "Tout le catalogue high-tech : smartphones, tablettes, ordinateurs, audio, objets connectés, TV, gaming et accessoires. Prix en FCFA, livraison au Sénégal.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const { categories, mapCategory } = await universeFilter();
  return (
    <CatalogPage
      eyebrow="Catalogue"
      title="Tous les produits"
      intro="Smartphones, informatique, audio, objets connectés et accessoires : filtrez par univers, marque ou budget."
      basePath="/shop"
      base={{}}
      searchParams={await searchParams}
      categories={categories}
      mapCategory={mapCategory}
    />
  );
}
