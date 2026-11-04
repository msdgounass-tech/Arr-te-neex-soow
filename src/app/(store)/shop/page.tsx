import type { Metadata } from "next";
import { CatalogPage, type SearchParams } from "@/components/catalog/CatalogPage";
import { GENDER_OPTIONS } from "@/lib/catalog-options";

export const metadata: Metadata = { title: "Boutique", description: "Toute la boutique GOUNASS LUXURY : vêtements, chaussures et accessoires de luxe pour homme et femme." };

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <CatalogPage
      eyebrow="La boutique"
      title="Shop"
      intro="L'ensemble de nos pièces pour homme et femme, réunies en un seul lieu."
      basePath="/shop"
      base={{}}
      searchParams={await searchParams}
      categories={GENDER_OPTIONS}
      categoryParam="genre"
      mapCategory={() => []}
    />
  );
}
