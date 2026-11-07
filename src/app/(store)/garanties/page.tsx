import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/queries";
import { toWhatsAppNumber } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { ShieldIcon, WhatsAppIcon } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Garanties & retours",
  description: "Échange sous 7 jours, garantie des produits high-tech et démarches de retour : nos conditions claires.",
  alternates: { canonical: "/garanties" },
};
export const revalidate = 300;

const STEPS = [
  { t: "Contactez-nous", d: "Par WhatsApp ou via le formulaire de contact, en indiquant votre numéro de commande et le motif de votre demande." },
  { t: "Vérification", d: "L'équipe vérifie que le produit remplit les conditions d'échange et vous indique la marche à suivre." },
  { t: "Échange", d: "Le produit est échangé selon la disponibilité. Les conditions de reprise vous sont confirmées avant tout renvoi." },
];

export default async function WarrantyPage() {
  const { store } = await getSettings();
  const wa = toWhatsAppNumber(store.whatsapp);
  return (
    <div className="container-luxe max-w-5xl">
      <PageHeader eyebrow="Aide" title="Garanties & retours" intro="Des règles simples, annoncées avant l'achat, pour acheter votre matériel en toute sérénité." />

      <div className="grid gap-4 md:grid-cols-2">
        <section className="surface p-6 md:p-8" aria-labelledby="echange">
          <ShieldIcon width={28} height={28} className="text-accent-light" />
          <h2 id="echange" className="display mt-5 text-2xl md:text-3xl">Échange sous 7 jours</h2>
          <p className="mt-3 leading-relaxed text-ivory/80">
            Un produit peut être échangé dans les 7 jours suivant sa réception, à condition qu&apos;il n&apos;ait pas été utilisé et qu&apos;il soit rendu complet :
            accessoires, câbles, notices et emballage d&apos;origine, sous réserve des règles légales applicables.
          </p>
        </section>
        <section className="surface p-6 md:p-8" aria-labelledby="garantie">
          <ShieldIcon width={28} height={28} className="text-accent-light" />
          <h2 id="garantie" className="display mt-5 text-2xl md:text-3xl">Garantie des produits</h2>
          <p className="mt-3 leading-relaxed text-ivory/80">
            La garantie dépend du produit et de sa marque : elle vous est précisée sur demande avant l&apos;achat. Conservez votre reçu de commande (disponible depuis la
            page de suivi), il sert de preuve d&apos;achat.
          </p>
        </section>
      </div>

      <section className="mt-16" aria-labelledby="demarche">
        <h2 id="demarche" className="display text-2xl md:text-3xl">La démarche</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.t} className="surface p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-accent/50 text-sm font-bold text-accent-light">{i + 1}</span>
              <p className="mt-4 font-semibold">{s.t}</p>
              <p className="mt-2 text-sm leading-relaxed text-mist">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-12 flex flex-col gap-3 sm:flex-row">
        {wa && (
          <a href={`https://wa.me/${wa}?text=${encodeURIComponent("Bonjour, j'ai une demande d'échange pour ma commande n° ")}`} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
            <WhatsAppIcon width={20} height={20} /> Demande sur WhatsApp
          </a>
        )}
        <Link href="/contact" className="btn btn-outline">Formulaire de contact</Link>
        <Link href="/conditions" className="btn btn-outline">Conditions de vente</Link>
      </div>
    </div>
  );
}
