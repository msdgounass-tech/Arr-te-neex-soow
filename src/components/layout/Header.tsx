"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { Wordmark } from "@/components/brand/Logo";
import { BagIcon, CloseIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from "@/components/ui/Icons";
import { NAV } from "@/lib/site";
import { cartCount, useCart } from "@/store/cart";
import { useFavorites } from "@/store/favorites";
import { useUI } from "@/store/ui";
import { useHydrated } from "@/hooks/useHydrated";

const SUB = {
  men: ["Vêtements", "Chaussures", "Montres", "Sacs", "Lunettes", "Parfums", "Bijoux", "Accessoires"],
  women: ["Vêtements", "Robes", "Chaussures", "Sacs", "Montres", "Lunettes", "Parfums", "Bijoux", "Accessoires"],
};
const subSlug = (prefix: "homme" | "femme", label: string) =>
  `${prefix}-${label.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()}`;

export function Header({ announcement }: { announcement?: string }) {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const [scrolled, setScrolled] = useState(false);
  const lines = useCart((s) => s.lines);
  const setCartOpen = useCart((s) => s.setOpen);
  const favCount = useFavorites((s) => s.ids.length);
  const { menuOpen, setMenu, setSearch } = useUI();
  const count = hydrated ? cartCount(lines) : 0;
  const overHero = pathname === "/" && !scrolled && !menuOpen;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenu(false), [pathname, setMenu]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
  }, [menuOpen]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      {announcement ? (
        <div className="relative z-[61] bg-gold py-2 text-center text-[0.62rem] font-semibold uppercase tracking-[0.3em] text-ink">
          {announcement}
        </div>
      ) : null}
      <header
        className={clsx(
          "sticky top-0 z-[60] transition-[background,border-color,backdrop-filter] duration-700",
          overHero
            ? "border-b border-transparent bg-gradient-to-b from-ink/70 to-transparent"
            : "border-b border-white/[0.06] bg-ink/85 backdrop-blur-xl",
        )}
      >
        <div className="container-luxe flex h-[72px] items-center justify-between gap-4 lg:h-[84px]">
          <div className="flex items-center gap-2 lg:hidden">
            <button aria-label="Ouvrir le menu" onClick={() => setMenu(!menuOpen)} className="-ml-2 p-2 text-ivory">
              {menuOpen ? <CloseIcon width={22} height={22} /> : <MenuIcon width={22} height={22} />}
            </button>
            <button aria-label="Rechercher" onClick={() => setSearch(true)} className="p-2 text-ivory">
              <SearchIcon />
            </button>
          </div>

          <Link href="/" aria-label="GOUNASS LUXURY — accueil" className="shrink-0">
            <Wordmark compact className="hidden sm:flex" />
            <Wordmark compact className="sm:hidden [&>span:last-child]:hidden" />
          </Link>

          <nav aria-label="Navigation principale" className="hidden items-center gap-8 xl:gap-10 lg:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                data-active={isActive(n.href)}
                className={clsx(
                  "link-luxe text-[0.66rem] font-medium uppercase tracking-[0.3em] transition-colors",
                  isActive(n.href) ? "text-gold" : "text-ivory/85 hover:text-ivory",
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-0.5 sm:gap-1.5">
            <button aria-label="Rechercher" onClick={() => setSearch(true)} className="hidden p-2.5 text-ivory/90 hover:text-gold lg:block">
              <SearchIcon />
            </button>
            <Link href="/compte" aria-label="Mon compte" className="hidden p-2.5 text-ivory/90 hover:text-gold sm:block">
              <UserIcon />
            </Link>
            <Link href="/favoris" aria-label="Mes favoris" className="relative p-2.5 text-ivory/90 hover:text-gold">
              <HeartIcon />
              {hydrated && favCount > 0 && (
                <span className="absolute right-1 top-1.5 h-1.5 w-1.5 rounded-full bg-gold" aria-label={`${favCount} favoris`} />
              )}
            </Link>
            <button aria-label={`Panier, ${count} article(s)`} onClick={() => setCartOpen(true)} className="relative p-2.5 text-ivory/90 hover:text-gold">
              <BagIcon />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    className="absolute -right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[0.6rem] font-bold text-ink"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 top-[72px] z-[55] overflow-y-auto bg-ink lg:hidden"
          >
            <div className="container-luxe flex min-h-full flex-col py-8">
              <nav aria-label="Menu mobile" className="flex flex-col">
                {NAV.map((n, i) => (
                  <motion.div
                    key={n.href}
                    initial={{ opacity: 0, x: -18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.06 * i + 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="border-b border-white/[0.06]"
                  >
                    <Link href={n.href} className={clsx("display block py-4 text-[2rem]", isActive(n.href) ? "text-gold" : "text-ivory")}>
                      {n.label}
                    </Link>
                    {(n.href === "/men" || n.href === "/women") && (
                      <div className="no-scrollbar -mt-1 flex gap-4 overflow-x-auto pb-4">
                        {SUB[n.href === "/men" ? "men" : "women"].map((s) => (
                          <Link
                            key={s}
                            href={`${n.href}?categorie=${subSlug(n.href === "/men" ? "homme" : "femme", s)}`}
                            className="shrink-0 text-[0.62rem] uppercase tracking-[0.24em] text-mist hover:text-gold"
                          >
                            {s}
                          </Link>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </nav>
              <div className="mt-auto grid grid-cols-2 gap-3 pt-10">
                <Link href="/compte" className="btn btn-outline">Mon compte</Link>
                <Link href="/suivi" className="btn btn-outline">Suivre</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
