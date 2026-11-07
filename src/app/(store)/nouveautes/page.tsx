import type { Metadata } from "next";
import { CatalogPage, type SearchParams } from "@/components/catalog/CatalogPage";
import { universeFilter } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Nouveautés",
  description: "Les derniers produits high-tech arrivés en boutique : smartphones, audio, informatique et accessoires.",
  alternates: { canonical: "/nouveautes" },
};

export default async function NewPage({ searchParams }: { searchParams: SearchParams }) {
  const { categories, mapCategory } = await universeFilter();
  return <CatalogPage eyebrow="Fraîchement arrivés" title="Nouveautés" basePath="/nouveautes" base={{ isNew: true }} searchParams={await searchParams} categories={categories} mapCategory={mapCategory} />;
}
