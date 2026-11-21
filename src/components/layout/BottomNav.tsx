"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { BagIcon, MenuIcon, SearchIcon, UserIcon } from "@/components/ui/Icons";
import { cartCount, useCart } from "@/store/cart";
import { useUI } from "@/store/ui";
import { useHydrated } from "@/hooks/useHydrated";

const HomeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" />
  </svg>
);

/** Barre de navigation fixe en bas de l'écran (téléphone et tablette). */
export function BottomNav() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const lines = useCart((s) => s.lines);
  const setCartOpen = useCart((s) => s.setOpen);
  const { menuOpen, setMenu, setSearch } = useUI();
  const count = hydrated ? cartCount(lines) : 0;
  const item = "flex flex-1 flex-col items-center justify-center gap-1 text-[0.66rem] uppercase tracking-[0.12em]";
  const on = (active: boolean) => (active ? "text-gold" : "text-ivory");
  return (
    <nav aria-label="Navigation rapide" className="fixed inset-x-0 bottom-0 z-[65] flex h-16 border-t border-white/[0.14] bg-ink-2/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl xl:hidden">
      <Link href="/" onClick={() => setMenu(false)} className={clsx(item, on(pathname === "/" && !menuOpen))}><HomeIcon />Accueil</Link>
      <button onClick={() => setMenu(!menuOpen)} className={clsx(item, on(menuOpen))}><MenuIcon width={22} height={22} />Rayons</button>
      <button onClick={() => { setMenu(false); setSearch(true); }} className={clsx(item, "text-ivory")}><SearchIcon width={22} height={22} />Chercher</button>
      <button onClick={() => { setMenu(false); setCartOpen(true); }} className={clsx(item, "relative text-ivory")}>
        <BagIcon width={22} height={22} />Panier
        {count > 0 && <span className="absolute left-1/2 top-1.5 ml-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[0.7rem] font-bold text-ink">{count}</span>}
      </button>
      <Link href="/compte" onClick={() => setMenu(false)} className={clsx(item, on(pathname.startsWith("/compte")))}><UserIcon width={22} height={22} />Compte</Link>
    </nav>
  );
}
