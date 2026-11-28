"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

const LINKS = [
  ["/admin", "Vue d'ensemble", "grid"], ["/admin/paiements", "Paiements", "wallet"], ["/admin/boutiques", "Boutiques", "store"],
  ["/admin/produits", "Produits", "tag"], ["/admin/commandes", "Commandes", "package"], ["/admin/utilisateurs", "Utilisateurs", "user"],
  ["/admin/signalements", "Signalements", "flag"], ["/admin/avis", "Avis", "star"], ["/admin/ia", "Shoppy AI", "sparkles"],
] as const;

export function AdminNav({ badges }: { badges: Record<string, number> }) {
  const path = usePathname();
  const active = (h: string) => (h === "/admin" ? path === h : path.startsWith(h));
  return (
    <>
      <nav aria-label="Administration" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:hidden">
        {LINKS.map(([href, label]) => (
          <Link key={href} href={href} aria-current={active(href) ? "page" : undefined} className="chip press shrink-0">{label}{badges[href] ? ` (${badges[href]})` : ""}</Link>
        ))}
      </nav>
      <nav aria-label="Administration" className="hidden md:block">
        <ul className="space-y-0.5">{LINKS.map(([href, label, icon]) => (
          <li key={href}><Link href={href} aria-current={active(href) ? "page" : undefined}
            className={`press flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${active(href) ? "bg-orange-soft text-orange-text" : "hover:bg-mist"}`}>
            <Icon name={icon} size={18} /><span className="flex-1">{label}</span>
            {badges[href] ? <span className="rounded-full bg-orange-strong px-2 text-xs font-bold text-white">{badges[href]}</span> : null}</Link></li>))}</ul>
      </nav>
    </>
  );
}
