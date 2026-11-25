"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import type { Category, Domain, Region } from "@/lib/types";
import { Sheet } from "@/components/ui/Sheet";
import { Icon } from "@/components/ui/Icon";

const SORTS = [
  ["relevance", "Pertinence"], ["newest", "Nouveautés"], ["price_asc", "Prix croissant"], ["price_desc", "Prix décroissant"], ["popular", "Popularité"],
] as const;

export function ExploreToolbar({ domains, categories, regions, total, view }:
  { domains: Domain[]; categories: Category[]; regions: Region[]; total: number; view: "produits" | "boutiques" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [draft, setDraft] = useState(() => Object.fromEntries(params.entries()) as Record<string, string>);

  const go = (next: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v) p.set(k, v);
    p.delete("page");
    start(() => router.push(`/explorer${p.size ? `?${p}` : ""}`, { scroll: false }));
  };
  const current = Object.fromEntries(params.entries()) as Record<string, string>;
  const activeCount = ["domaine", "categorie", "min", "max", "region", "dispo"].filter((k) => current[k]).length;
  const cats = categories.filter((c) => !draft.domaine || String(c.domain_id) === draft.domaine);

  return (
    <div className="flex flex-wrap items-center gap-2" aria-busy={pending}>
      <div role="tablist" aria-label="Type de résultats" className="flex rounded-full bg-mist p-1">
        {(["produits", "boutiques"] as const).map((v) => (
          <button key={v} role="tab" aria-selected={view === v} type="button" onClick={() => go({ ...current, vue: v === "boutiques" ? "boutiques" : undefined })}
            className={`press rounded-full px-4 py-1.5 text-sm font-semibold ${view === v ? "bg-white shadow-sm" : "text-slate"}`}>
            {v === "produits" ? "Produits" : "Boutiques"}
          </button>
        ))}
      </div>
      <button type="button" className="chip press" onClick={() => { setDraft(current); setOpen(true); }}>
        <Icon name="filter" size={16} /> Filtres{activeCount ? ` (${activeCount})` : ""}
      </button>
      {view === "produits" && (
        <label className="ml-auto flex items-center gap-2 text-sm">
          <span className="text-slate">Trier</span>
          <select className="field h-9 min-h-0 w-auto rounded-full py-0 text-sm" value={current.tri ?? (current.q ? "relevance" : "newest")}
            onChange={(e) => go({ ...current, tri: e.target.value })}>
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
      )}
      <p className="w-full text-sm text-slate" aria-live="polite">{pending ? "Recherche…" : `${total} résultat${total > 1 ? "s" : ""}`}</p>

      <Sheet open={open} onClose={() => setOpen(false)} title="Filtres"
        footer={<div className="flex gap-2">
          <button type="button" className="btn btn-secondary press flex-1" onClick={() => { const r = { q: current.q, vue: current.vue }; setDraft(r as Record<string, string>); go(r); setOpen(false); }}>Effacer</button>
          <button type="button" className="btn btn-primary press flex-1" onClick={() => { go(draft); setOpen(false); }}>Afficher les résultats</button></div>}>
        <div className="space-y-5">
          <div><label className="label" htmlFor="f-domain">Domaine</label>
            <select id="f-domain" className="field" value={draft.domaine ?? ""} onChange={(e) => setDraft({ ...draft, domaine: e.target.value, categorie: "" })}>
              <option value="">Tous les domaines</option>{domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
          {view === "produits" && (
            <div><label className="label" htmlFor="f-cat">Catégorie</label>
              <select id="f-cat" className="field" value={draft.categorie ?? ""} onChange={(e) => setDraft({ ...draft, categorie: e.target.value })}>
                <option value="">Toutes les catégories</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          )}
          <div><label className="label" htmlFor="f-region">Localisation</label>
            <select id="f-region" className="field" value={draft.region ?? ""} onChange={(e) => setDraft({ ...draft, region: e.target.value })}>
              <option value="">Tout le Sénégal</option>{regions.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}</select></div>
          {view === "produits" && (<>
            <fieldset><legend className="label">Prix (FCFA)</legend>
              <div className="flex items-center gap-2">
                <input className="field" inputMode="numeric" placeholder="Min." aria-label="Prix minimum" value={draft.min ?? ""} onChange={(e) => setDraft({ ...draft, min: e.target.value.replace(/\D/g, "") })} />
                <span className="text-slate">à</span>
                <input className="field" inputMode="numeric" placeholder="Max." aria-label="Prix maximum" value={draft.max ?? ""} onChange={(e) => setDraft({ ...draft, max: e.target.value.replace(/\D/g, "") })} />
              </div></fieldset>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-line p-3">
              <span className="text-sm font-medium">Disponible uniquement</span>
              <input type="checkbox" className="h-5 w-5 accent-[var(--color-orange-strong)]" checked={draft.dispo === "1"} onChange={(e) => setDraft({ ...draft, dispo: e.target.checked ? "1" : "" })} />
            </label>
          </>)}
        </div>
      </Sheet>
    </div>
  );
}
