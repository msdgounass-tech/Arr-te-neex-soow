import type { Metadata } from "next";
import { CatalogPage, type SearchParams } from "@/components/catalog/CatalogPage";
import { MEN_CATEGORIES } from "@/lib/catalog-options";

export const metadata: Metadata = { title: "Homme", description: "Collection homme GOUNASS LUXURY : vêtements, chaussures, montres, sacs, lunettes, parfums, bijoux et accessoires." };

export default async function MenPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <CatalogPage eyebrow="Collection" title="Homme" intro="Un vestiaire masculin d'exception, de la tenue de soirée aux accessoires du quotidien." basePath="/men" base={{ gender: "homme" }} searchParams={await searchParams} categories={MEN_CATEGORIES} />
  );
}
