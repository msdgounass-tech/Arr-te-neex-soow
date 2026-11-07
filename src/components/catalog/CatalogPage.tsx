import Link from "next/link";
import { getBrands, getProducts, PAGE_SIZE, type ProductFilters, type SortKey } from "@/lib/queries";
import { ProductGrid } from "@/components/product/ProductGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { CatalogToolbar, type CatOption } from "./CatalogToolbar";
import clsx from "clsx";

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || "";

interface Props {
  eyebrow: string;
  title: string;
  intro?: string;
  basePath: string;
  base: ProductFilters;
  searchParams: Awaited<SearchParams>;
  categories?: CatOption[];
  categoryParam?: string;
  /** transforme la valeur du filtre de catégorie en liste de slugs */
  mapCategory?: (value: string) => string[];
  /** valeur active quand les pastilles sont des liens */
  activeCategory?: string;
  breadcrumbs?: { href: string; label: string }[];
  /** contenu affiché entre l'en-tête et la grille */
  children?: React.ReactNode;
}

export async function CatalogPage({ eyebrow, title, intro, basePath, base, searchParams, categories = [], categoryParam = "categorie", mapCategory, activeCategory, breadcrumbs, children }: Props) {
  const page = Math.max(1, parseInt(one(searchParams.page)) || 1);
  const catValue = one(searchParams[categoryParam]);
  const filters: ProductFilters = {
    ...base,
    q: one(searchParams.q) || undefined,
    sort: (["recent", "price-asc", "price-desc", "name"].includes(one(searchParams.tri)) ? one(searchParams.tri) : "recent") as SortKey,
    min: parseInt(one(searchParams.min)) || undefined,
    max: parseInt(one(searchParams.max)) || undefined,
    brand: one(searchParams.marque).slice(0, 40) || undefined,
    page,
  };
  if (catValue && activeCategory === undefined) filters.categorySlugs = mapCategory ? mapCategory(catValue) : [catValue];

  const [{ items, count }, brands] = await Promise.all([getProducts(filters), getBrands()]);
  const pages = Math.ceil(count / PAGE_SIZE);
  const q = filters.q;

  const pageHref = (p: number) => {
    const sp = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => {
      const val = one(v);
      if (val && k !== "page") sp.set(k, val);
    });
    if (p > 1) sp.set("page", String(p));
    return `${basePath}${sp.toString() ? `?${sp}` : ""}`;
  };

  return (
    <div className="container-luxe">
      <header className="relative pb-8 pt-10 md:pb-12 md:pt-16">
        <div aria-hidden className="pointer-events-none absolute -top-20 left-0 h-64 w-[36rem] max-w-full bg-[radial-gradient(closest-side,rgba(126,164,255,.14),transparent)]" />
        <div className="anim-rise relative">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav aria-label="Fil d'Ariane" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-mist">
              {breadcrumbs.map((b, i) => (
                <span key={b.href} className="flex items-center gap-2">
                  {i > 0 && <span aria-hidden>/</span>}
                  <Link href={b.href} className="hover:text-white">{b.label}</Link>
                </span>
              ))}
            </nav>
          )}
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="display mt-4 text-[2.6rem] sm:text-6xl md:text-7xl">{title}</h1>
          {q && <p className="mt-4 text-mist">Résultats pour « {q} »</p>}
          {intro && !q && <p className="mt-4 max-w-2xl leading-relaxed text-ivory/80">{intro}</p>}
        </div>
      </header>

      {children}

      <CatalogToolbar categories={categories} paramName={categoryParam} count={count} brands={brands} activeCategory={activeCategory} />

      <div className="pt-8 md:pt-10">
        <h2 className="sr-only">Produits</h2>
        {items.length ? (
          <ProductGrid products={items} />
        ) : (
          <EmptyState
            title={q || filters.brand || filters.min || filters.max ? "Aucun résultat" : "Bientôt disponible"}
            text={
              q || filters.brand || filters.min || filters.max
                ? "Aucun produit ne correspond à ces critères. Modifiez les filtres ou explorez tout le catalogue."
                : "Cette sélection est en cours de mise en ligne. Écrivez-nous pour connaître les disponibilités."
            }
            cta={{ href: "/shop", label: "Voir tout le catalogue" }}
          />
        )}
      </div>

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-14 flex flex-wrap justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={pageHref(p)}
              aria-current={p === page ? "page" : undefined}
              className={clsx("flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold transition-colors", p === page ? "border-ivory bg-ivory text-ink" : "border-white/15 hover:border-white/40")}
            >
              {p}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
