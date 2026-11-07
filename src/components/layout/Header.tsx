"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Wordmark } from "@/components/brand/Logo";
import { ArrowRight, BagIcon, ChevronDown, CloseIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from "@/components/ui/Icons";
import { BRAND, NAV_TAIL } from "@/lib/site";
import { cartCount, useCart } from "@/store/cart";
import { useFavorites } from "@/store/favorites";
import { useUI } from "@/store/ui";
import { useHydrated } from "@/hooks/useHydrated";
import { useStaffRole } from "@/hooks/useStaffRole";
import { adminItemsFor } from "@/lib/admin-nav";
import { CategoryIcon } from "./CategoryIcon";

export interface NavCategory {
  name: string;
  slug: string;
  children: { name: string; slug: string }[];
}

const ease = [0.22, 1, 0.36, 1] as const;

export function Header({ announcement, logoUrl, categories }: { announcement?: string; logoUrl?: string; categories: NavCategory[] }) {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const reduce = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [mega, setMega] = useState(false);
  const [openUniverse, setOpenUniverse] = useState<string | null>(null);
  const megaTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lines = useCart((s) => s.lines);
  const setCartOpen = useCart((s) => s.setOpen);
  const favCount = useFavorites((s) => s.ids.length);
  const { menuOpen, setMenu, setSearch } = useUI();
  const staffRole = useStaffRole();
  const count = hydrated ? cartCount(lines) : 0;
  const overHero = pathname === "/" && !scrolled && !menuOpen && !mega;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Raccourcis clavier : Ctrl/⌘+K ou « / » ouvrent la recherche.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement)?.tagName || "");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setSearch(true);
      }
      if (e.key === "Escape") setMega(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSearch]);

  useEffect(() => {
    setMenu(false);
    setMega(false);
  }, [pathname, setMenu]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
  }, [menuOpen]);

  const openMega = () => {
    clearTimeout(megaTimer.current);
    setMega(true);
  };
  const closeMega = () => {
    clearTimeout(megaTimer.current);
    megaTimer.current = setTimeout(() => setMega(false), 140);
  };

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const quick = categories.slice(0, 3);

  return (
    <>
      {announcement ? (
        <div className="relative z-[61] border-b border-white/[0.06] bg-ink-2 py-2 text-center text-[0.78rem] font-semibold text-ivory/85">
          <span className="container-luxe block truncate">{announcement}</span>
        </div>
      ) : null}
      <header
        onMouseLeave={closeMega}
        className={clsx(
          "sticky top-0 z-[60] transition-[background-color,border-color,backdrop-filter] duration-500",
          overHero ? "border-b border-transparent bg-transparent" : "glass border-x-0 border-t-0",
        )}
      >
        <div className="container-luxe flex h-16 items-center justify-between gap-3 lg:h-[72px]">
          <div className="flex items-center gap-1 lg:hidden">
            <button aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={menuOpen} onClick={() => setMenu(!menuOpen)} className="-ml-2 rounded-full p-2.5 text-ivory hover:bg-white/[0.06]">
              {menuOpen ? <CloseIcon width={22} height={22} /> : <MenuIcon width={22} height={22} />}
            </button>
          </div>

          <Link href="/" className="shrink-0">
            <Wordmark compact logoUrl={logoUrl} />
            <span className="sr-only"> — accueil</span>
          </Link>

          <nav aria-label="Navigation principale" className="hidden items-center gap-1 lg:flex">
            {categories.length > 0 && (
              <button
                type="button"
                onMouseEnter={openMega}
                onFocus={openMega}
                onClick={() => setMega((m) => !m)}
                aria-expanded={mega}
                aria-controls="mega-menu"
                className={clsx("flex items-center gap-1.5 rounded-full px-4 py-2 text-[0.88rem] font-semibold transition-colors", mega ? "bg-white/[0.08] text-white" : "text-ivory/85 hover:text-white")}
              >
                Catalogue
                <ChevronDown width={14} height={14} className={clsx("transition-transform duration-300", mega && "rotate-180")} />
              </button>
            )}
            {quick.map((c) => (
              <Link
                key={c.slug}
                href={`/categorie/${c.slug}`}
                onMouseEnter={closeMega}
                className={clsx("rounded-full px-4 py-2 text-[0.88rem] font-semibold transition-colors", isActive(`/categorie/${c.slug}`) ? "text-white" : "text-ivory/85 hover:text-white")}
              >
                {c.name}
              </Link>
            ))}
            {NAV_TAIL.map((n) => (
              <div key={n.href} className="group relative" onMouseEnter={closeMega}>
                <Link
                  href={n.children?.[0]?.href || n.href}
                  className={clsx("flex items-center gap-1.5 rounded-full px-4 py-2 text-[0.88rem] font-semibold transition-colors", n.children?.some((c) => isActive(c.href)) ? "text-white" : "text-ivory/85 hover:text-white")}
                >
                  {n.label}
                  {n.children && <ChevronDown width={14} height={14} className="opacity-70 transition-transform duration-300 group-hover:rotate-180" />}
                </Link>
                {n.children && (
                  <div className="glass invisible absolute left-1/2 top-full z-50 mt-2 w-60 -translate-x-1/2 translate-y-2 rounded-2xl p-2 opacity-0 shadow-2xl transition-all duration-300 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                    {n.children.map((c) => (
                      <Link key={c.href} href={c.href} className="block rounded-xl px-4 py-2.5 text-sm text-ivory/90 transition-colors hover:bg-white/[0.06] hover:text-white">
                        {c.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-0.5 sm:gap-1">
            <button
              aria-label="Rechercher (Ctrl+K)"
              onClick={() => setSearch(true)}
              className="hidden items-center gap-3 rounded-full border border-white/[0.1] bg-white/[0.04] py-2 pl-3.5 pr-2 text-sm text-mist transition-colors hover:border-white/25 hover:text-ivory xl:flex"
            >
              <SearchIcon width={17} height={17} />
              <span className="w-28 text-left">Rechercher…</span>
              <kbd className="rounded-md border border-white/15 px-1.5 py-0.5 font-sans text-[0.68rem] text-mist">Ctrl K</kbd>
            </button>
            <button aria-label="Rechercher" onClick={() => setSearch(true)} className="rounded-full p-2.5 text-ivory/90 hover:bg-white/[0.06] hover:text-white xl:hidden">
              <SearchIcon />
            </button>
            {staffRole && (
              <Link href="/admin" className="ml-1 hidden rounded-full border border-accent/50 px-3 py-1.5 text-[0.74rem] font-bold text-accent-light hover:bg-accent/15 lg:block">
                Admin
              </Link>
            )}
            <Link href="/compte" aria-label="Mon compte" className="hidden rounded-full p-2.5 text-ivory/90 hover:bg-white/[0.06] hover:text-white sm:block">
              <UserIcon />
            </Link>
            <Link href="/favoris" aria-label={hydrated && favCount > 0 ? `Mes favoris (${favCount})` : "Mes favoris"} className="relative rounded-full p-2.5 text-ivory/90 hover:bg-white/[0.06] hover:text-white">
              <HeartIcon />
              {hydrated && favCount > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_rgba(126,164,255,.9)]" />}
            </Link>
            <motion.button
              key={`cart-${count}`}
              initial={reduce || count === 0 ? false : { scale: 0.86 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 14 }}
              aria-label={`Panier, ${count} article${count > 1 ? "s" : ""}`}
              onClick={() => setCartOpen(true)}
              className="relative rounded-full p-2.5 text-ivory/90 hover:bg-white/[0.06] hover:text-white"
            >
              <BagIcon />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0.4, opacity: 0, y: -6 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    className="absolute -right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[0.7rem] font-bold text-ink"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Méga-menu catalogue (ordinateur) */}
        <AnimatePresence>
          {mega && categories.length > 0 && (
            <motion.div
              id="mega-menu"
              onMouseEnter={openMega}
              initial={reduce ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease }}
              className="absolute inset-x-0 top-full hidden border-b border-white/[0.08] bg-ink/95 backdrop-blur-2xl lg:block"
            >
              <div className="container-luxe grid grid-cols-3 gap-x-6 gap-y-8 py-10 xl:grid-cols-6">
                {categories.map((c, i) => (
                  <motion.div key={c.slug} initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i, duration: 0.4, ease }}>
                    <Link href={`/categorie/${c.slug}`} className="group flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-accent-light transition-colors group-hover:border-accent/60 group-hover:bg-accent/10">
                        <CategoryIcon slug={c.slug} width={19} height={19} />
                      </span>
                      <span className="font-semibold text-ivory group-hover:text-white">{c.name}</span>
                    </Link>
                    <ul className="mt-4 space-y-2 pl-[3.25rem]">
                      {c.children.map((s) => (
                        <li key={s.slug}>
                          <Link href={`/categorie/${s.slug}`} className="text-sm text-mist transition-colors hover:text-white">
                            {s.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
              <div className="container-luxe flex items-center justify-between border-t border-white/[0.06] py-4 text-sm">
                <span className="text-mist">Prix en FCFA · Livraison à Dakar et dans les régions</span>
                <Link href="/shop" className="group inline-flex items-center gap-2 font-semibold text-accent-light">
                  Tout le catalogue <ArrowRight width={16} height={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Menu mobile */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 top-16 z-[55] overflow-y-auto overscroll-contain bg-ink lg:hidden"
          >
            <div className="container-luxe flex min-h-full flex-col gap-6 py-6">
              <button onClick={() => { setMenu(false); setSearch(true); }} className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-left text-mist">
                <SearchIcon width={18} height={18} /> Rechercher un produit, une marque…
              </button>

              {staffRole && (
                <div className="rounded-2xl border border-accent/30 bg-accent/[0.06] p-4">
                  <p className="mb-3 text-[0.72rem] font-bold uppercase tracking-[0.2em] text-accent-light">Espace administration</p>
                  <div className="grid grid-cols-2 gap-2">
                    {adminItemsFor(staffRole).map((a) => (
                      <Link key={a.href} href={a.href} onClick={() => setMenu(false)} className="flex min-h-11 items-center rounded-xl border border-white/[0.12] bg-ink px-3 text-[0.84rem] text-ivory">
                        {a.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <nav aria-label="Menu mobile" className="flex flex-col">
                <p className="label mb-2">Catalogue</p>
                {categories.map((c, i) => {
                  const open = openUniverse === c.slug;
                  return (
                    <motion.div
                      key={c.slug}
                      initial={reduce ? false : { opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.04 * i + 0.05, duration: 0.45, ease }}
                      className="border-b border-white/[0.08]"
                    >
                      <div className="flex items-center">
                        <Link href={`/categorie/${c.slug}`} onClick={() => setMenu(false)} className="flex flex-1 items-center gap-3 py-4 text-lg font-semibold">
                          <CategoryIcon slug={c.slug} width={20} height={20} className="text-accent-light" />
                          {c.name}
                        </Link>
                        <button aria-label={`${open ? "Masquer" : "Afficher"} les sous-catégories ${c.name}`} aria-expanded={open} onClick={() => setOpenUniverse(open ? null : c.slug)} className="rounded-full p-3 text-mist">
                          <ChevronDown width={18} height={18} className={clsx("transition-transform duration-300", open && "rotate-180")} />
                        </button>
                      </div>
                      <AnimatePresence initial={false}>
                        {open && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease }} className="overflow-hidden">
                            <div className="flex flex-wrap gap-2 pb-4">
                              {c.children.map((s) => (
                                <Link key={s.slug} href={`/categorie/${s.slug}`} onClick={() => setMenu(false)} className="chip">
                                  {s.name}
                                </Link>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
                <Link href="/shop" onClick={() => setMenu(false)} className="flex items-center justify-between border-b border-white/[0.08] py-4 text-lg font-semibold">
                  Tout le catalogue <ArrowRight width={18} height={18} />
                </Link>
              </nav>

              {NAV_TAIL.map((n) => (
                <div key={n.href}>
                  <p className="label mb-3">{n.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {n.children?.map((c) => (
                      <Link key={c.href} href={c.href} onClick={() => setMenu(false)} className="chip" data-active={isActive(c.href)}>
                        {c.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}

              <div className="mt-auto grid grid-cols-2 gap-3 pt-4">
                <Link href="/compte" className="btn btn-outline">Mon compte</Link>
                <Link href="/suivi" className="btn btn-outline">Suivi</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
