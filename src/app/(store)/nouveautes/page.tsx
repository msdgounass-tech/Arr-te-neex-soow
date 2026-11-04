import type { Metadata } from "next";
import { CatalogPage, type SearchParams } from "@/components/catalog/CatalogPage";
import { GENDER_OPTIONS } from "@/lib/catalog-options";

export const metadata: Metadata = { title: "Nouveautés" };

export default async function NewPage({ searchParams }: { searchParams: SearchParams }) {
  return <CatalogPage eyebrow="Fraîchement arrivées" title="Nouveautés" basePath="/nouveautes" base={{ isNew: true }} searchParams={await searchParams} categories={GENDER_OPTIONS} categoryParam="genre" filterKind="gender" />;
}
