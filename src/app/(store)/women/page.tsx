import type { Metadata } from "next";
import { CatalogPage, type SearchParams } from "@/components/catalog/CatalogPage";
import { WOMEN_CATEGORIES } from "@/lib/catalog-options";

export const metadata: Metadata = { title: "Femme", description: "Collection femme GOUNASS LUXURY : robes, vêtements, chaussures, sacs, montres, lunettes, parfums, bijoux et accessoires." };

export default async function WomenPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <CatalogPage eyebrow="Collection" title="Femme" intro="Robes, silhouettes et accessoires pour une élégance affirmée." basePath="/women" base={{ gender: "femme" }} searchParams={await searchParams} categories={WOMEN_CATEGORIES} />
  );
}
