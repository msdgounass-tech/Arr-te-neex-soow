import type { Metadata } from "next";
import { CatalogPage, type SearchParams } from "@/components/catalog/CatalogPage";
import { GENDER_OPTIONS } from "@/lib/catalog-options";

export const metadata: Metadata = { title: "Promotions" };

export default async function PromoPage({ searchParams }: { searchParams: SearchParams }) {
  return <CatalogPage eyebrow="Offres privilèges" title="Promotions" basePath="/promotions" base={{ onSale: true }} searchParams={await searchParams} categories={GENDER_OPTIONS} categoryParam="genre" mapCategory={() => []} />;
}
