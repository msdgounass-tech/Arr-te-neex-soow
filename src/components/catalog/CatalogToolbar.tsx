"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import clsx from "clsx";

export interface CatOption { label: string; value: string }

export function CatalogToolbar({ categories, paramName = "categorie", count }: { categories: CatOption[]; paramName?: string; count: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [showPrice, setShowPrice] = useState(Boolean(params.get("min") || params.get("max")));
  const [min, setMin] = useState(params.get("min") || "");
  const [max, setMax] = useState(params.get("max") || "");

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    next.delete("page");
    start(() => router.push(`${pathname}${next.toString() ? `?${next}` : ""}`, { scroll: false }));
  };

  const active = params.get(paramName) || "";

  return (
    <div className={clsx("relative z-30 -mx-5 border-y border-white/[0.1] bg-ink/90 px-5 backdrop-blur-xl transition-opacity md:-mx-10 md:px-10 lg:sticky lg:top-[84px] xl:-mx-16 xl:px-16", pending && "opacity-70")}>
      <div className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
        {categories.length > 0 && (
          <div className="-mx-1 flex min-w-0 flex-1 flex-wrap gap-1.5 lg:flex-nowrap lg:overflow-x-auto lg:no-scrollbar">
            {[{ label: "Tout", value: "" }, ...categories].map((c) => (
              <button
                key={c.value || "all"}
                onClick={() => update({ [paramName]: c.value || null })}
                className={clsx(
                  "inline-flex min-h-10 shrink-0 items-center px-3.5 text-[0.74rem] uppercase tracking-[0.14em] transition-colors",
                  active === c.value ? "border border-gold bg-gold text-ink" : "border border-white/[0.12] text-ivory/90 hover:border-gold/60 hover:text-gold",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
        <div className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-3 whitespace-nowrap text-[0.74rem] uppercase tracking-[0.16em] text-mist lg:pl-6">
          <span>{count} pièce{count > 1 ? "s" : ""}</span>
          <button onClick={() => setShowPrice((s) => !s)} className="hover:text-gold">Prix {showPrice ? "−" : "+"}</button>
          <label className="flex items-center gap-2">
            Trier
            <select
              value={params.get("tri") || "recent"}
              onChange={(e) => update({ tri: e.target.value === "recent" ? null : e.target.value })}
              className="bg-transparent py-1 text-ivory focus:outline-none"
            >
              <option value="recent" className="bg-ink-2">Nouveautés</option>
              <option value="price-asc" className="bg-ink-2">Prix croissant</option>
              <option value="price-desc" className="bg-ink-2">Prix décroissant</option>
              <option value="name" className="bg-ink-2">Nom</option>
            </select>
          </label>
        </div>
      </div>
      {showPrice && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            update({ min: min || null, max: max || null });
          }}
          className="flex flex-wrap items-end gap-4 pb-4"
        >
          <label className="w-32">
            <span className="label">Min (FCFA)</span>
            <input inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} className="field py-2" />
          </label>
          <label className="w-32">
            <span className="label">Max (FCFA)</span>
            <input inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} className="field py-2" />
          </label>
          <button className="btn btn-ghost-gold min-h-10 px-5">Appliquer</button>
          {(min || max) && (
            <button type="button" onClick={() => { setMin(""); setMax(""); update({ min: null, max: null }); }} className="pb-2 text-[0.8rem] uppercase tracking-[0.2em] text-mist hover:text-ivory">
              Effacer
            </button>
          )}
        </form>
      )}
    </div>
  );
}
