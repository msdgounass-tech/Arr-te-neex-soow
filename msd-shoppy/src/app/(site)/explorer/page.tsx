import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { ExploreToolbar } from "@/components/explore/Filters";
import { ProductGrid } from "@/components/product/ProductCard";
import { ShopCard } from "@/components/shop/ShopCard";
import { EmptyState } from "@/components/ui/bits";
import { getCategories, getDomains, getRegions, getTrustMap, searchProducts, searchShops, type SearchParams } from "@/lib/queries";

type Params = Record<string, string | undefined>;
const num = (v?: string) => (v && /^\d+$/.test(v) ? Number(v) : undefined);
const PER_PAGE = 24;

export async function generateMetadata({ searchParams }: { searchParams: Promise<Params> }): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `« ${q} »` : "Explorer le catalogue", description: "Recherchez parmi les produits et les boutiques de MSD Shoppy." };
}

export default async function ExplorePage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const view = sp.vue === "boutiques" ? "boutiques" : "produits";
  const page = Math.max(1, num(sp.page) ?? 1);
  const sort = (["relevance", "newest", "price_asc", "price_desc", "popular"] as const).find((s) => s === sp.tri);
  const query: SearchParams = {
    q: sp.q?.trim() || undefined, domain: num(sp.domaine), category: num(sp.categorie), min: num(sp.min), max: num(sp.max),
    region: sp.region || undefined, available: sp.dispo === "1" || undefined, sort, page, perPage: PER_PAGE,
  };
  const [domains, categories, regions] = await Promise.all([getDomains(), getCategories(), getRegions()]);
  const domainById = new Map(domains.map((d) => [d.id, d]));

  let content: React.ReactNode; let total = 0;
  if (view === "boutiques") {
    const shops = await searchShops(query.q, query.domain, query.region, 48);
    total = shops.length;
    content = shops.length ? (
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{shops.map((s) => <li key={s.id}><ShopCard shop={s} domain={domainById.get(s.domain_id)} /></li>)}</ul>
    ) : <EmptyState icon="store" title="Aucune boutique ne correspond" text="Essayez un autre mot ou retirez des filtres." />;
  } else {
    const res = await searchProducts(query);
    total = res.total;
    const trust = await getTrustMap(res.items.map((p) => p.shop.id));
    const pages = Math.ceil(res.total / PER_PAGE);
    const pageHref = (n: number) => { const p = new URLSearchParams(sp as Record<string, string>); p.set("page", String(n)); return `/explorer?${p}`; };
    content = res.items.length ? (
      <>
        <ProductGrid items={res.items} trust={trust} priorityCount={8} />
        {pages > 1 && (
          <nav aria-label="Pages" className="mt-8 flex items-center justify-center gap-2">
            {page > 1 && <Link className="btn btn-secondary press" href={pageHref(page - 1)}>Précédent</Link>}
            <span className="px-3 text-sm text-slate">Page {page} sur {pages}</span>
            {page < pages && <Link className="btn btn-secondary press" href={pageHref(page + 1)}>Suivant</Link>}
          </nav>
        )}
      </>
    ) : <EmptyState title={query.q ? `Aucun résultat pour « ${query.q} »` : "Aucun produit pour ces filtres"}
          text="Vérifiez l'orthographe, utilisez un mot plus général ou retirez des filtres." action={{ href: "/explorer", label: "Voir tout le catalogue" }} />;
  }

  return (
    <div className="container-page py-5 md:py-8">
      <h1 className="sr-only">Explorer</h1>
      <div className="md:hidden"><Suspense><HeaderSearch /></Suspense></div>
      {query.q && <p className="mt-4 text-lg font-semibold md:mt-0">Résultats pour « {query.q} »</p>}
      <div className="mt-4"><Suspense><ExploreToolbar domains={domains} categories={categories} regions={regions} total={total} view={view} /></Suspense></div>
      <div className="mt-5">{content}</div>
    </div>
  );
}
