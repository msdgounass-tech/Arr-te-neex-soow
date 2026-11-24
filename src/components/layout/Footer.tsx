import Link from "next/link";
import { BrandLogo } from "@/components/brand/Logo";
import { InstagramIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { NewsletterForm } from "./NewsletterForm";
import { formatPhone, toWhatsAppNumber } from "@/lib/format";
import type { StoreSettings } from "@/lib/types";

const COLS = [
  {
    title: "Boutique",
    links: [
      ["Homme", "/men"],
      ["Femme", "/women"],
      ["Accessoires", "/accessories"],
      ["Nouveautés", "/nouveautes"],
      ["Meilleures ventes", "/meilleures-ventes"],
      ["Promotions", "/promotions"],
    ],
  },
  {
    title: "La Maison",
    links: [
      ["Collections", "/collections"],
      ["Contact", "/contact"],
      ["Livraison", "/livraison"],
      ["Suivre une commande", "/suivi"],
    ],
  },
  {
    title: "Mon espace",
    links: [
      ["Mon compte", "/compte"],
      ["Mes commandes", "/compte/commandes"],
      ["Mes favoris", "/favoris"],
      ["Panier", "/panier"],
    ],
  },
];

export function Footer({ store, logoUrl }: { store: StoreSettings; logoUrl?: string }) {
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-24 border-t border-white/[0.1] bg-ink">
      <div className="container-luxe grid gap-14 py-20 lg:grid-cols-[1.3fr_2fr]">
        <div>
          <BrandLogo size={176} src={logoUrl} className="h-36 w-36 ring-1 ring-gold/40 md:h-44 md:w-44" />
          <div className="mt-10 max-w-sm">
            <p className="label mb-1">Newsletter privée</p>
            <NewsletterForm />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          {COLS.map((c) => (
            <div key={c.title}>
              <p className="eyebrow mb-6">{c.title}</p>
              <ul className="space-y-3.5">
                {c.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} prefetch={false} className="link-luxe text-sm text-ivory/90 hover:text-ivory">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <p className="eyebrow mb-6">Nous joindre</p>
            <ul className="space-y-3.5 text-sm text-ivory/90">
              {store.address && <li>{[store.address, store.city].filter(Boolean).join(", ")}</li>}
              {store.city && !store.address && <li>{store.city}</li>}
              {store.phone && (
                <li>
                  <a href={`tel:+${toWhatsAppNumber(store.phone)}`} className="hover:text-ivory">{formatPhone(store.phone)}</a>
                </li>
              )}
              {store.email && (
                <li>
                  <a href={`mailto:${store.email}`} className="break-all hover:text-ivory">{store.email}</a>
                </li>
              )}
              {store.opening_hours && <li className="text-mist">{store.opening_hours}</li>}
              <li>
                <Link href="/contact" className="link-luxe">Formulaire de contact</Link>
              </li>
            </ul>
            <div className="mt-6 flex gap-3">
              {store.whatsapp && (
                <a aria-label="WhatsApp" href={`https://wa.me/${toWhatsAppNumber(store.whatsapp)}`} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center border border-white/15 text-ivory/90 hover:border-gold hover:text-gold">
                  <WhatsAppIcon />
                </a>
              )}
              {store.instagram && (
                <a aria-label="Instagram" href={store.instagram.startsWith("http") ? store.instagram : `https://instagram.com/${store.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center border border-white/15 text-ivory/90 hover:border-gold hover:text-gold">
                  <InstagramIcon />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="hairline" />
      <div className="container-luxe flex flex-col items-center justify-between gap-4 py-8 text-[0.8rem] uppercase tracking-[0.24em] text-mist text-center md:flex-row md:text-left">
        <p>© {year} GOUNASS LUXURY — Tous droits réservés</p>
        <div className="flex flex-wrap justify-center gap-6">
          <Link href="/conditions" prefetch={false} className="hover:text-ivory">Conditions de vente</Link>
          <Link href="/confidentialite" prefetch={false} className="hover:text-ivory">Confidentialité</Link>
          <span>Paiement : Wave · Orange Money · Carte · Livraison</span>
        </div>
      </div>
    </footer>
  );
}
