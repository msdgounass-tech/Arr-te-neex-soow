import type { Metadata } from "next";
import { CatalogPage, type SearchParams } from "@/components/catalog/CatalogPage";
import { universeFilter } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Promotions",
  description: "Les offres du moment sur les smartphones, l'audio, l'informatique et les accessoires. Prix en FCFA.",
  alternates: { canonical: "/promotions" },
};

export default async function PromoPage({ searchParams }: { searchParams: SearchParams }) {
  const { categories, mapCategory } = await universeFilter();
  return <CatalogPage eyebrow="Offres du moment" title="Promotions" basePath="/promotions" base={{ onSale: true }} searchParams={await searchParams} categories={categories} mapCategory={mapCategory} />;
}
