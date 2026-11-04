"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useUI } from "@/store/ui";
import { CloseIcon, SearchIcon } from "@/components/ui/Icons";
import { formatPrice } from "@/lib/format";

interface Hit { id: string; name: string; slug: string; price: number; image: string | null; category: string | null }

export function SearchOverlay() {
  const { searchOpen, setSearch } = useUI();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) setTimeout(() => input.current?.focus(), 150);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSearch(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen, setSearch]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setHits([]);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        const json = await res.json();
        setHits(json.items || []);
      } catch {
        /* requête annulée */
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setSearch(false);
    router.push(`/shop?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div
          role="dialog"
          aria-label="Recherche"
          className="fixed inset-0 z-[85] overflow-y-auto bg-ink/97 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="container-luxe py-6">
            <div className="flex justify-end">
              <button aria-label="Fermer la recherche" onClick={() => setSearch(false)} className="p-2 text-ivory/80 hover:text-gold">
                <CloseIcon width={24} height={24} />
              </button>
            </div>
            <motion.form
              onSubmit={submit}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto mt-10 max-w-3xl"
            >
              <p className="eyebrow text-center">Rechercher</p>
              <div className="mt-6 flex items-center gap-4 border-b border-gold/50 pb-4">
                <SearchIcon width={26} height={26} className="text-gold" />
                <input
                  ref={input}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Une pièce, une matière, une référence…"
                  className="display w-full bg-transparent text-3xl text-ivory placeholder:text-ivory/25 focus:outline-none md:text-5xl"
                  aria-label="Terme de recherche"
                />
              </div>
            </motion.form>

            <div className="mx-auto mt-10 max-w-3xl">
              {loading && <p className="text-center text-sm text-mist">Recherche…</p>}
              {!loading && q.trim().length >= 2 && hits.length === 0 && (
                <p className="text-center text-sm text-mist">Aucune pièce ne correspond à « {q} ».</p>
              )}
              <ul className="grid gap-px bg-white/[0.04] sm:grid-cols-2">
                {hits.map((h) => (
                  <li key={h.id} className="bg-ink">
                    <Link href={`/produit/${h.slug}`} onClick={() => setSearch(false)} className="flex items-center gap-4 p-4 hover:bg-ink-2">
                      <span className="relative h-16 w-12 shrink-0 overflow-hidden bg-ink-3">
                        {h.image && <Image src={h.image} alt="" fill sizes="48px" className="object-cover" />}
                      </span>
                      <span className="min-w-0">
                        <span className="display block truncate text-lg">{h.name}</span>
                        <span className="text-xs text-mist">{h.category ? `${h.category} · ` : ""}{formatPrice(h.price)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              {hits.length > 0 && (
                <div className="mt-8 text-center">
                  <button onClick={submit} className="btn btn-ghost-gold">Voir tous les résultats</button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
