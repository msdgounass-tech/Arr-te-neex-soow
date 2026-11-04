import type { Metadata } from "next";
import { CatalogPage, type SearchParams } from "@/components/catalog/CatalogPage";
import { GENDER_OPTIONS } from "@/lib/catalog-options";

export const metadata: Metadata = {
  title: "Chaussures",
  description: "Chaussures de luxe GOUNASS LUXURY pour homme et femme : mocassins, derbies, escarpins, sandales. Livraison au Sénégal.",
  alternates: { canonical: "/chaussures" },
};

export default async function ShoesPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <CatalogPage
      eyebrow="Souliers"
      title="Chaussures"
      intro="Cuirs nobles et finitions soignées : des souliers pour chaque moment, du quotidien aux grandes occasions."
      basePath="/chaussures"
      base={{ categorySlugs: ["homme-chaussures", "femme-chaussures"] }}
      searchParams={await searchParams}
      categories={GENDER_OPTIONS}
      categoryParam="genre"
      filterKind="gender"
    />
  );
}
