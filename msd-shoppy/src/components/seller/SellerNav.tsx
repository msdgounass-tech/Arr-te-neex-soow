"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

export const SELLER_LINKS = [
  ["/vendeur", "Tableau de bord", "grid"], ["/vendeur/commandes", "Commandes", "package"], ["/vendeur/produits", "Produits", "tag"],
  ["/vendeur/boutique", "Ma boutique", "store"], ["/vendeur/livraison", "Livraison", "truck"], ["/vendeur/ia", "Shoppy AI", "sparkles"], ["/vendeur/statistiques", "Statistiques", "chart"],
  ["/vendeur/confiance", "Confiance et qualité", "shield"], ["/vendeur/promouvoir", "Promotion", "share"], ["/vendeur/assistant", "Assistant", "bulb"],
  ["/vendeur/abonnement", "Abonnement", "wallet"],
] as const;

export function SellerNav({ pending }: { pending: number }) {
  const path = usePathname();
  const active = (href: string) => (href === "/vendeur" ? path === href : path === href || path.startsWith(href + "/"));
  return (
    <>
      <nav aria-label="Espace vendeur" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:hidden">
        {SELLER_LINKS.map(([href, label]) => (
          <Link key={href} href={href} aria-current={active(href) ? "page" : undefined} className="chip press">{label}{href === "/vendeur/commandes" && pending > 0 ? ` (${pending})` : ""}</Link>
        ))}
      </nav>
      <nav aria-label="Espace vendeur" className="hidden md:block">
        <ul className="space-y-0.5">
          {SELLER_LINKS.map(([href, label, icon]) => (
            <li key={href}><Link href={href} aria-current={active(href) ? "page" : undefined}
              className={`press flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${active(href) ? "bg-orange-soft text-orange-text" : "hover:bg-mist"}`}>
              <Icon name={icon} size={18} /><span className="flex-1">{label}</span>
              {href === "/vendeur/commandes" && pending > 0 && <span className="rounded-full bg-orange-strong px-2 text-xs font-bold text-white">{pending}</span>}
            </Link></li>
          ))}
        </ul>
      </nav>
    </>
  );
}
