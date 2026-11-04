import type { Metadata } from "next";
import { getSettings } from "@/lib/queries";
import { formatPhone, toWhatsAppNumber } from "@/lib/format";
import { ContactForm } from "@/components/layout/ContactForm";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = { title: "Contact", description: "Contactez GOUNASS LUXURY : conseil, commande, livraison." };
export const revalidate = 300;

export default async function ContactPage() {
  const { store } = await getSettings();
  return (
    <div className="container-luxe pt-16 md:pt-24">
      <header className="mb-16 text-center">
        <Reveal>
          <p className="eyebrow">Service client</p>
          <h1 className="display mt-5 text-5xl md:text-8xl">Contact</h1>
          <p className="mx-auto mt-6 max-w-lg text-ivory/90">Une question sur une pièce, une taille ou une livraison ? Notre équipe vous répond.</p>
        </Reveal>
      </header>
      <div className="grid gap-16 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-10">
          {store.whatsapp && (
            <a href={`https://wa.me/${toWhatsAppNumber(store.whatsapp)}`} target="_blank" rel="noopener noreferrer" className="btn btn-gold w-full">
              <WhatsAppIcon /> Écrire sur WhatsApp
            </a>
          )}
          <dl className="space-y-8">
            {store.address && <div><dt className="label">Adresse</dt><dd className="display mt-2 text-2xl">{[store.address, store.city].filter(Boolean).join(", ")}</dd></div>}
            {!store.address && store.city && <div><dt className="label">Boutique</dt><dd className="display mt-2 text-2xl">{store.city}</dd></div>}
            {store.phone && <div><dt className="label">Téléphone</dt><dd className="display mt-2 text-2xl"><a href={`tel:+${toWhatsAppNumber(store.phone)}`}>{formatPhone(store.phone)}</a></dd></div>}
            {store.whatsapp && <div><dt className="label">WhatsApp</dt><dd className="display mt-2 text-2xl">{formatPhone(store.whatsapp)}</dd></div>}
            {store.email && <div><dt className="label">E-mail</dt><dd className="display mt-2 break-all text-2xl"><a href={`mailto:${store.email}`}>{store.email}</a></dd></div>}
            {store.opening_hours && <div><dt className="label">Horaires</dt><dd className="mt-2 text-ivory/90">{store.opening_hours}</dd></div>}
          </dl>
        </div>
        <div className="border border-white/[0.1] bg-ink-2 p-6 md:p-10">
          <h2 className="display mb-8 text-3xl">Écrivez-nous</h2>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
