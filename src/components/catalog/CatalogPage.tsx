import Link from "next/link";
import { getProducts, PAGE_SIZE, type ProductFilters, type SortKey } from "@/lib/queries";
import { ProductGrid } from "@/components/product/ProductGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";
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
  /** transforme la valeur du filtre de catégorie en liste de slugs */
  categoryParam?: string;
  mapCategory?: (value: string) => string[];
}

export async function CatalogPage({ eyebrow, title, intro, basePath, base, searchParams, categories = [], categoryParam = "categorie", mapCategory }: Props) {
  const page = Math.max(1, parseInt(one(searchParams.page)) || 1);
  const catValue = one(searchParams[categoryParam]);
  const filters: ProductFilters = {
    ...base,
    q: one(searchParams.q) || undefined,
    sort: (one(searchParams.tri) as SortKey) || "recent",
    min: parseInt(one(searchParams.min)) || undefined,
    max: parseInt(one(searchParams.max)) || undefined,
    page,
  };
  if (catValue) filters.categorySlugs = mapCategory ? mapCategory(catValue) : [catValue];
  if (one(searchParams.genre) === "homme" || one(searchParams.genre) === "femme") filters.gender = one(searchParams.genre) as "homme" | "femme";

  const { items, count } = await getProducts(filters);
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
      <header className="pb-12 pt-16 text-center md:pb-16 md:pt-24">
        <Reveal>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="display mt-5 text-5xl md:text-8xl">{title}</h1>
          {q && <p className="mt-5 text-sm text-mist">Résultats pour « {q} »</p>}
          {intro && !q && <p className="mx-auto mt-6 max-w-xl leading-relaxed text-ivory/65">{intro}</p>}
        </Reveal>
      </header>

      <CatalogToolbar categories={categories} paramName={categoryParam} count={count} />

      <div className="pt-12">
        {items.length ? (
          <ProductGrid products={items} />
        ) : (
          <EmptyState
            title={q ? "Aucun résultat" : "Bientôt disponible"}
            text={q ? "Essayez un autre terme ou explorez l'ensemble de la boutique." : "Cette sélection est en cours de préparation. Revenez très prochainement."}
            cta={{ href: "/shop", label: "Explorer la boutique" }}
          />
        )}
      </div>

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-16 flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={pageHref(p)}
              aria-current={p === page ? "page" : undefined}
              className={clsx("flex h-11 w-11 items-center justify-center border text-sm transition-colors", p === page ? "border-gold bg-gold text-ink" : "border-white/10 hover:border-gold")}
            >
              {p}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
