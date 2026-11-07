"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { useUI } from "@/store/ui";
import { ArrowRight, CloseIcon, SearchIcon } from "@/components/ui/Icons";
import { formatPrice } from "@/lib/format";
import { CategoryIcon } from "./CategoryIcon";
import type { NavCategory } from "./Header";

interface Hit { id: string; name: string; slug: string; price: number; image: string | null; category: string | null; brand: string | null }

export function SearchOverlay({ categories = [] }: { categories?: NavCategory[] }) {
  const { searchOpen, setSearch } = useUI();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!searchOpen) return;
    const t = setTimeout(() => input.current?.focus(), 80);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSearch(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [searchOpen, setSearch]);

  useEffect(() => {
    const term = q.trim();
    setCursor(-1);
    if (term.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        const json = await res.json();
        setHits(json.items || []);
        setLoading(false);
      } catch {
        /* requête annulée par une frappe plus récente */
      }
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const go = (href: string) => {
    setSearch(false);
    router.push(href);
  };

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (cursor >= 0 && hits[cursor]) return go(`/produit/${hits[cursor].slug}`);
    if (!q.trim()) return;
    go(`/shop?q=${encodeURIComponent(q.trim())}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!hits.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => (c + 1) % hits.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => (c <= 0 ? hits.length - 1 : c - 1));
    }
  };

  const term = q.trim();

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Recherche"
          className="fixed inset-0 z-[85] overflow-y-auto bg-ink/80 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.target === e.currentTarget && setSearch(false)}
        >
          <motion.div
            initial={{ y: -16, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="glass mx-auto mt-4 w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-3xl shadow-[0_40px_120px_-30px_rgba(0,0,0,.9)] md:mt-20"
          >
            <form onSubmit={submit} className="flex items-center gap-3 border-b border-white/[0.08] px-5">
              <SearchIcon width={20} height={20} className="shrink-0 text-accent-light" />
              <input
                ref={input}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="iPhone, écouteurs, chargeur, marque…"
                className="h-16 w-full bg-transparent text-lg text-ivory placeholder:text-mist/70 focus:outline-none"
                aria-label="Terme de recherche"
                aria-autocomplete="list"
                aria-controls="search-results"
                aria-activedescendant={cursor >= 0 ? `hit-${cursor}` : undefined}
                enterKeyHint="search"
                autoComplete="off"
              />
              {loading && <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/20 border-t-accent" aria-hidden />}
              <button type="button" aria-label="Fermer la recherche" onClick={() => setSearch(false)} className="shrink-0 rounded-full p-2 text-mist hover:bg-white/[0.06] hover:text-white">
                <CloseIcon width={20} height={20} />
              </button>
            </form>

            <div className="max-h-[70vh] overflow-y-auto p-3">
              {term.length < 2 && categories.length > 0 && (
                <div className="p-2">
                  <p className="label mb-3">Parcourir</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {categories.map((c) => (
                      <button key={c.slug} onClick={() => go(`/categorie/${c.slug}`)} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3 text-left text-sm font-semibold transition-colors hover:border-accent/50 hover:bg-accent/[0.08]">
                        <CategoryIcon slug={c.slug} width={18} height={18} className="shrink-0 text-accent-light" />
                        <span className="truncate">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!loading && term.length >= 2 && hits.length === 0 && (
                <p className="px-3 py-10 text-center text-sm text-mist">Aucun produit ne correspond à « {term} ».</p>
              )}

              <ul id="search-results" role="listbox" aria-label="Résultats">
                {hits.map((h, i) => (
                  <li key={h.id} id={`hit-${i}`} role="option" aria-selected={cursor === i}>
                    <Link
                      href={`/produit/${h.slug}`}
                      onClick={() => setSearch(false)}
                      onMouseEnter={() => setCursor(i)}
                      className={clsx("flex items-center gap-4 rounded-2xl p-2.5 transition-colors", cursor === i ? "bg-white/[0.07]" : "hover:bg-white/[0.04]")}
                    >
                      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/[0.05]">
                        {h.image && <Image src={h.image} alt="" fill sizes="56px" className="object-contain p-1" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{h.name}</span>
                        <span className="text-xs text-mist">{[h.brand, h.category].filter(Boolean).join(" · ")}</span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold">{formatPrice(h.price)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {hits.length > 0 && (
                <button onClick={() => submit()} className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.08] py-3 text-sm font-semibold text-accent-light hover:bg-white/[0.04]">
                  Voir tous les résultats pour « {term} » <ArrowRight width={16} height={16} />
                </button>
              )}
            </div>
            <div className="hidden items-center gap-4 border-t border-white/[0.06] px-5 py-3 text-[0.72rem] text-mist sm:flex">
              <span><kbd className="rounded border border-white/15 px-1">↑</kbd> <kbd className="rounded border border-white/15 px-1">↓</kbd> naviguer</span>
              <span><kbd className="rounded border border-white/15 px-1">Entrée</kbd> ouvrir</span>
              <span><kbd className="rounded border border-white/15 px-1">Échap</kbd> fermer</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
