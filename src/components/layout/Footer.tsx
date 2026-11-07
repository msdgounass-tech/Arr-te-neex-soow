import Link from "next/link";
import { Wordmark } from "@/components/brand/Logo";
import { InstagramIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { NewsletterForm } from "./NewsletterForm";
import { formatPhone, toWhatsAppNumber } from "@/lib/format";
import { BRAND } from "@/lib/site";
import type { StoreSettings } from "@/lib/types";
import type { NavCategory } from "./Header";

const HELP: [string, string][] = [
  ["Questions fréquentes", "/faq"],
  ["Livraison", "/livraison"],
  ["Garanties & retours", "/garanties"],
  ["Suivre une commande", "/suivi"],
  ["Contact", "/contact"],
];
const ACCOUNT: [string, string][] = [
  ["Mon compte", "/compte"],
  ["Mes commandes", "/compte/commandes"],
  ["Mes favoris", "/favoris"],
  ["Panier", "/panier"],
];

const social = (v: string, base: string) => (v.startsWith("http") ? v : `${base}${v.replace("@", "")}`);

export function Footer({ store, logoUrl, categories }: { store: StoreSettings; logoUrl?: string; categories: NavCategory[] }) {
  const year = new Date().getFullYear();
  const shop: [string, string][] = [
    ...categories.map((c) => [c.name, `/categorie/${c.slug}`] as [string, string]),
    ["Nouveautés", "/nouveautes"],
    ["Promotions", "/promotions"],
  ];
  const cols = [
    { title: "Catalogue", links: shop },
    { title: "Aide", links: HELP },
    { title: "Mon espace", links: ACCOUNT },
  ];
  return (
    <footer className="relative mt-24 overflow-hidden border-t border-white/[0.08] bg-ink-2/60">
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[60rem] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(126,164,255,.14),transparent)]" />
      <div className="container-luxe relative grid gap-14 py-16 md:py-20 lg:grid-cols-[1.2fr_2fr]">
        <div>
          <Wordmark logoUrl={logoUrl} />
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-mist">{BRAND.description}</p>
          <div className="mt-8 max-w-sm">
            <p className="label mb-3">Offres et nouveautés par e-mail</p>
            <NewsletterForm />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          {cols.map((c) => (
            <div key={c.title}>
              <p className="mb-5 text-sm font-bold text-ivory">{c.title}</p>
              <ul className="space-y-3">
                {c.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-mist transition-colors hover:text-white">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <p className="mb-5 text-sm font-bold text-ivory">Nous joindre</p>
            <ul className="space-y-3 text-sm text-mist">
              {(store.address || store.city) && <li>{[store.address, store.city].filter(Boolean).join(", ")}</li>}
              {store.phone && (
                <li>
                  <a href={`tel:+${toWhatsAppNumber(store.phone)}`} className="hover:text-white">{formatPhone(store.phone)}</a>
                </li>
              )}
              {store.email && (
                <li>
                  <a href={`mailto:${store.email}`} className="break-all hover:text-white">{store.email}</a>
                </li>
              )}
              {store.opening_hours && <li>{store.opening_hours}</li>}
            </ul>
            <div className="mt-6 flex gap-2">
              {store.whatsapp && (
                <a aria-label="WhatsApp" href={`https://wa.me/${toWhatsAppNumber(store.whatsapp)}`} target="_blank" rel="noopener noreferrer" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/12 text-ivory/90 transition-colors hover:border-[#23bd60] hover:text-[#23bd60]">
                  <WhatsAppIcon />
                </a>
              )}
              {store.instagram && (
                <a aria-label="Instagram" href={social(store.instagram, "https://instagram.com/")} target="_blank" rel="noopener noreferrer" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/12 text-ivory/90 transition-colors hover:border-white/40">
                  <InstagramIcon />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="hairline" />
      <div className="container-luxe flex flex-col items-center justify-between gap-4 py-7 text-center text-[0.8rem] text-mist md:flex-row md:text-left">
        <p>© {year} {BRAND.legalName} — Tous droits réservés</p>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          <Link href="/conditions" className="hover:text-white">Conditions de vente</Link>
          <Link href="/confidentialite" className="hover:text-white">Confidentialité</Link>
          <span>Wave · Orange Money · Paiement à la livraison</span>
        </div>
      </div>
    </footer>
  );
}
