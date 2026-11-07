"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { Wordmark } from "@/components/brand/Logo";
import { CloseIcon, MenuIcon } from "@/components/ui/Icons";
import type { UserRole } from "@/lib/types";
import { adminItemsFor } from "@/lib/admin-nav";

const ROLE_LABEL: Record<UserRole, string> = { customer: "Client", staff: "Équipe", manager: "Gérant", admin: "Administrateur" };

export function AdminNav({ role, name }: { role: UserRole; name: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = adminItemsFor(role);
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  return (
    <>
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/[0.1] bg-ink px-5 py-4 lg:hidden">
        <Wordmark compact />
        <button aria-label="Menu" onClick={() => setOpen(!open)} className="flex items-center gap-2 border border-accent/40 px-3 py-2 text-[0.72rem] uppercase tracking-[0.2em] text-accent">
          {open ? <CloseIcon width={18} height={18} /> : <MenuIcon width={18} height={18} />} Menu
        </button>
      </div>
      <nav aria-label="Rubriques" className="sticky top-[83px] z-30 flex gap-2 overflow-x-auto border-b border-white/[0.1] bg-ink px-5 py-3 lg:hidden [scrollbar-width:none]">
        {items.map((i) => (
          <Link key={i.href} href={i.href} className={clsx("shrink-0 border px-3 py-2 text-[0.74rem] whitespace-nowrap", active(i.href) ? "border-accent bg-accent/10 text-accent" : "border-white/[0.14] text-ivory/90")}>
            {i.label}
          </Link>
        ))}
      </nav>
      <aside className={clsx("fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/[0.1] bg-ink-2 transition-transform lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="border-b border-white/[0.1] p-6">
          <Link href="/"><Wordmark compact /></Link>
          <p className="mt-5 text-xs text-ivory/90">{name}</p>
          <p className="text-[0.68rem] uppercase tracking-[0.24em] text-accent">{ROLE_LABEL[role]}</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          {items.map((i) => (
            <Link key={i.href} href={i.href} onClick={() => setOpen(false)} className={clsx("block px-4 py-2.5 text-[0.78rem] uppercase tracking-[0.18em] transition-colors", active(i.href) ? "bg-accent/10 text-accent" : "text-ivory/90 hover:text-ivory")}>
              {i.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/[0.1] p-4">
          <Link href="/" className="block px-4 py-2 text-[0.74rem] uppercase tracking-[0.2em] text-mist hover:text-ivory">← Voir la boutique</Link>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}
    </>
  );
}
