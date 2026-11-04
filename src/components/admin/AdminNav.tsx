"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { Wordmark } from "@/components/brand/Logo";
import { CloseIcon, MenuIcon } from "@/components/ui/Icons";
import type { UserRole } from "@/lib/types";

const RANK: Record<UserRole, number> = { customer: 0, staff: 1, manager: 2, admin: 3 };
const ITEMS: { href: string; label: string; min: UserRole }[] = [
  { href: "/admin", label: "Tableau de bord", min: "staff" },
  { href: "/admin/commandes", label: "Commandes", min: "staff" },
  { href: "/admin/produits", label: "Produits", min: "manager" },
  { href: "/admin/categories", label: "Catégories", min: "manager" },
  { href: "/admin/collections", label: "Collections", min: "manager" },
  { href: "/admin/coupons", label: "Codes promo", min: "manager" },
  { href: "/admin/livraison", label: "Livraison", min: "admin" },
  { href: "/admin/clients", label: "Clients & équipe", min: "staff" },
  { href: "/admin/messages", label: "Messages", min: "staff" },
  { href: "/admin/parametres", label: "Paramètres", min: "admin" },
];
const ROLE_LABEL: Record<UserRole, string> = { customer: "Client", staff: "Équipe", manager: "Gérant", admin: "Administrateur" };

export function AdminNav({ role, name }: { role: UserRole; name: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = ITEMS.filter((i) => RANK[role] >= RANK[i.min]);
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  return (
    <>
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/[0.06] bg-ink px-5 py-4 lg:hidden">
        <Wordmark compact />
        <button aria-label="Menu" onClick={() => setOpen(!open)}>{open ? <CloseIcon /> : <MenuIcon />}</button>
      </div>
      <aside className={clsx("fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/[0.06] bg-ink-2 transition-transform lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="border-b border-white/[0.06] p-6">
          <Link href="/"><Wordmark compact /></Link>
          <p className="mt-5 text-xs text-ivory/80">{name}</p>
          <p className="text-[0.58rem] uppercase tracking-[0.24em] text-gold">{ROLE_LABEL[role]}</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          {items.map((i) => (
            <Link key={i.href} href={i.href} onClick={() => setOpen(false)} className={clsx("block px-4 py-2.5 text-[0.7rem] uppercase tracking-[0.18em] transition-colors", active(i.href) ? "bg-gold/10 text-gold" : "text-ivory/70 hover:text-ivory")}>
              {i.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/[0.06] p-4">
          <Link href="/" className="block px-4 py-2 text-[0.66rem] uppercase tracking-[0.2em] text-mist hover:text-ivory">← Voir la boutique</Link>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}
    </>
  );
}
