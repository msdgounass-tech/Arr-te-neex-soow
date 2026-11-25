import Link from "next/link";
import { LogoMark } from "./Logo";
import { SoundToggle } from "./SoundToggle";

const COLS = [
  { title: "Acheter", links: [["/explorer", "Explorer le catalogue"], ["/explorer?vue=boutiques", "Toutes les boutiques"], ["/favoris", "Mes favoris"], ["/compte/commandes", "Suivre une commande"]] },
  { title: "Vendre", links: [["/vendre", "Ouvrir ma boutique"], ["/aide/guides-vendeurs", "Guides vendeurs"], ["/vendeur/assistant", "Assistant vendeur"], ["/aide/abonnements", "Abonnements"]] },
  { title: "Aide", links: [["/aide", "Centre d'aide"], ["/aide/faq", "Questions fréquentes"], ["/aide/signaler", "Signaler un problème"], ["/aide/confiance", "Comment fonctionne la confiance"]] },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-mist pb-24 md:pb-0">
      <div className="container-page grid gap-8 py-10 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2"><LogoMark size={28} /><span className="font-display text-lg font-bold">MSD Shoppy</span></div>
          <p className="mt-3 max-w-xs text-sm text-slate">Les boutiques du Sénégal au même endroit. Chaque vendeur gère sa boutique ; vous commandez directement chez lui.</p>
          <SoundToggle className="-ml-3 mt-4" />
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <h2 className="text-sm font-semibold">{c.title}</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate">
              {c.links.map(([href, label]) => <li key={href}><Link href={href} className="hover:text-ink">{label}</Link></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="container-page flex flex-wrap gap-x-6 gap-y-2 border-t border-line py-5 text-xs text-slate">
        <span>© {new Date().getFullYear()} MSD Shoppy</span>
        <Link href="/aide/conditions" className="hover:text-ink">Conditions d'utilisation</Link>
        <Link href="/aide/confidentialite" className="hover:text-ink">Confidentialité</Link>
      </div>
    </footer>
  );
}
