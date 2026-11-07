"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { formatPrice } from "@/lib/format";

export interface CatOption { label: string; value: string; href?: string }

const PRICE_PRESETS: { label: string; min?: number; max?: number }[] = [
  { label: "Moins de 25 000", max: 25000 },
  { label: "25 000 – 100 000", min: 25000, max: 100000 },
  { label: "100 000 – 300 000", min: 100000, max: 300000 },
  { label: "Plus de 300 000", min: 300000 },
];

export function CatalogToolbar({
  categories,
  paramName = "categorie",
  count,
  brands = [],
  activeCategory,
}: {
  categories: CatOption[];
  paramName?: string;
  count: number;
  brands?: string[];
  /** valeur active quand les pastilles sont des liens (pages catégorie) */
  activeCategory?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [showPrice, setShowPrice] = useState(Boolean(params.get("min") || params.get("max")));
  const [min, setMin] = useState(params.get("min") || "");
  const [max, setMax] = useState(params.get("max") || "");

  useEffect(() => {
    setMin(params.get("min") || "");
    setMax(params.get("max") || "");
  }, [params]);

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    next.delete("page");
    start(() => router.push(`${pathname}${next.toString() ? `?${next}` : ""}`, { scroll: false }));
  };

  const active = activeCategory ?? (params.get(paramName) || "");
  const brand = params.get("marque") || "";
  const hasPrice = Boolean(params.get("min") || params.get("max"));
  const filtersOn = Boolean(brand || hasPrice || params.get("q"));

  return (
    <div className={clsx("glass relative z-30 -mx-4 rounded-none border-x-0 px-4 transition-opacity sm:-mx-6 sm:px-6 lg:sticky lg:top-[72px] lg:mx-0 lg:rounded-2xl lg:border-x lg:px-4", pending && "opacity-70")}>
      <div className="flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
        {categories.length > 0 && (
          <div className="-mx-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-1 pb-0.5 no-scrollbar">
            {(activeCategory !== undefined ? categories : [{ label: "Tout", value: "" }, ...categories]).map((c) =>
              activeCategory !== undefined && c.href ? (
                <Link key={c.value || "all"} href={c.href} scroll={false} aria-current={active === c.value ? "page" : undefined} className="chip shrink-0">
                  {c.label}
                </Link>
              ) : (
                <button key={c.value || "all"} onClick={() => update({ [paramName]: c.value || null })} aria-pressed={active === c.value} className="chip shrink-0">
                  {c.label}
                </button>
              ),
            )}
          </div>
        )}
        <div className="flex shrink-0 flex-wrap items-center gap-2 text-sm lg:pl-4">
          <span className="mr-1 text-mist" aria-live="polite">
            {count} produit{count > 1 ? "s" : ""}
          </span>
          {brands.length > 0 && (
            <label className="relative">
              <span className="sr-only">Marque</span>
              <select value={brand} onChange={(e) => update({ marque: e.target.value || null })} className="chip appearance-none bg-transparent pr-8">
                <option value="">Toutes les marques</option>
                {brands.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <span aria-hidden className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[0.6rem] text-mist">▼</span>
            </label>
          )}
          <button onClick={() => setShowPrice((s) => !s)} aria-expanded={showPrice} data-active={hasPrice} className="chip">
            Prix
          </button>
          <label className="relative">
            <span className="sr-only">Trier par</span>
            <select value={params.get("tri") || "recent"} onChange={(e) => update({ tri: e.target.value === "recent" ? null : e.target.value })} className="chip appearance-none bg-transparent pr-8">
              <option value="recent">Nouveautés</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
              <option value="name">Nom (A–Z)</option>
            </select>
            <span aria-hidden className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[0.6rem] text-mist">▼</span>
          </label>
          {filtersOn && (
            <button onClick={() => update({ marque: null, min: null, max: null, q: null })} className="px-2 text-sm font-semibold text-accent-light hover:text-white">
              Réinitialiser
            </button>
          )}
        </div>
      </div>
      <AnimatePresence initial={false}>
        {showPrice && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
            <div className="flex flex-col gap-4 border-t border-white/[0.06] py-4 lg:flex-row lg:items-end">
              <div className="flex flex-wrap gap-1.5">
                {PRICE_PRESETS.map((p) => {
                  const on = (params.get("min") || "") === String(p.min ?? "") && (params.get("max") || "") === String(p.max ?? "");
                  return (
                    <button key={p.label} onClick={() => update({ min: p.min ? String(p.min) : null, max: p.max ? String(p.max) : null })} aria-pressed={on} className="chip">
                      {p.label} F
                    </button>
                  );
                })}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  update({ min: min || null, max: max || null });
                }}
                className="flex flex-wrap items-end gap-3 lg:ml-auto"
              >
                <label className="w-36">
                  <span className="label mb-1.5">Min (FCFA)</span>
                  <input inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} placeholder="0" className="field py-2" />
                </label>
                <label className="w-36">
                  <span className="label mb-1.5">Max (FCFA)</span>
                  <input inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} placeholder={formatPrice(1000000).replace(" FCFA", "")} className="field py-2" />
                </label>
                <button className="btn btn-primary min-h-11 px-5">Appliquer</button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
