import type { Metadata } from "next";
import { CatalogPage, type SearchParams } from "@/components/catalog/CatalogPage";
import { ACCESSORY_TYPES } from "@/lib/catalog-options";

export const metadata: Metadata = { title: "Accessoires", description: "Montres, sacs, lunettes, parfums et bijoux de luxe GOUNASS LUXURY." };

export default async function AccessoriesPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <CatalogPage
      eyebrow="Accessoires exclusifs"
      title="Accessories"
      intro="Les pièces qui achèvent une silhouette : montres, maroquinerie, lunettes, parfums et bijoux."
      basePath="/accessories"
      base={{ accessoriesOnly: true }}
      searchParams={await searchParams}
      categories={ACCESSORY_TYPES}
      categoryParam="type"
      mapCategory={(v) => [`homme-${v}`, `femme-${v}`]}
    />
  );
}
