import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogPage, type SearchParams } from "@/components/catalog/CatalogPage";
import { getCategoryBySlug } from "@/lib/queries";
import { SITE_URL } from "@/lib/env";

export const revalidate = 60;
type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const found = await getCategoryBySlug((await params).slug);
  if (!found) return { title: "Catégorie introuvable" };
  const { category, parent, children } = found;
  const sub = children.map((c) => c.name.toLowerCase()).join(", ");
  const description =
    category.description ||
    `${category.name}${parent ? ` (${parent.name})` : ""} : ${sub ? `${sub}. ` : ""}Prix en FCFA, livraison à Dakar et dans tout le Sénégal, commande en ligne ou sur WhatsApp.`;
  return {
    title: category.name,
    description,
    alternates: { canonical: `/categorie/${category.slug}` },
    openGraph: { title: category.name, description },
  };
}

export default async function CategoryPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { slug } = await params;
  const found = await getCategoryBySlug(slug);
  if (!found) notFound();
  const { category, parent, siblings, slugs } = found;

  // Pastilles : l'univers (« Tout ») puis ses types
  const universe = parent || category;
  const chips = [
    { label: `Tout ${universe.name.toLowerCase()}`, value: universe.slug, href: `/categorie/${universe.slug}` },
    ...siblings.map((c) => ({ label: c.name, value: c.slug, href: `/categorie/${c.slug}` })),
  ];

  const crumbs = [
    { href: "/", label: "Accueil" },
    { href: "/shop", label: "Catalogue" },
    ...(parent ? [{ href: `/categorie/${parent.slug}`, label: parent.name }] : []),
    { href: `/categorie/${category.slug}`, label: category.name },
  ];
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.label, item: `${SITE_URL}${c.href === "/" ? "" : c.href}` })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd).replace(/</g, "\\u003c") }} />
      <CatalogPage
        eyebrow={parent ? parent.name : "Univers"}
        title={category.name}
        intro={category.description || undefined}
        basePath={`/categorie/${category.slug}`}
        base={{ categorySlugs: slugs }}
        searchParams={await searchParams}
        categories={chips}
        activeCategory={category.slug}
        breadcrumbs={crumbs}
      />
    </>
  );
}
