"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

/** Recherche : la requête est transmise à Explorer (?q=…) et y reste affichée. */
export function HeaderSearch({ large = false, placeholder = "Rechercher un produit, une boutique…" }: { large?: boolean; placeholder?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  return (
    <form role="search" action="/explorer" onSubmit={(e) => { e.preventDefault(); router.push(`/explorer${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`); }}
      className="relative w-full">
      <label htmlFor={large ? "search-hero" : "search-header"} className="sr-only">Rechercher</label>
      <Icon name="search" size={large ? 22 : 18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate" />
      <input id={large ? "search-hero" : "search-header"} name="q" type="search" value={q} onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder} enterKeyHint="search" autoComplete="off"
        className={`w-full rounded-full border border-line bg-white text-ink placeholder:text-slate focus:border-transparent focus:outline-2 focus:outline-orange-strong ${large ? "h-14 pl-12 pr-28 text-base shadow-sm" : "h-11 pl-11 pr-4 text-sm"}`} />
      {large && <button type="submit" className="btn btn-primary press absolute right-1.5 top-1/2 h-11 -translate-y-1/2">Chercher</button>}
    </form>
  );
}
