import type { Metadata } from "next";
import { getSettings } from "@/lib/queries";
import { formatPhone, toWhatsAppNumber } from "@/lib/format";
import { ContactForm } from "@/components/layout/ContactForm";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Contact", description: "Contactez la boutique : conseil avant achat, commande, livraison et service après-vente.", alternates: { canonical: "/contact" } };
export const revalidate = 300;

export default async function ContactPage() {
  const { store } = await getSettings();
  return (
    <div className="container-luxe">
      <PageHeader eyebrow="Service client" title="Contact" intro="Une question sur un produit, une compatibilité ou une livraison ? Notre équipe vous répond." />
      <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <div className="space-y-10">
          {store.whatsapp && (
            <a href={`https://wa.me/${toWhatsAppNumber(store.whatsapp)}`} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp w-full">
              <WhatsAppIcon /> Écrire sur WhatsApp
            </a>
          )}
          <dl className="space-y-8">
            {store.address && <div><dt className="label">Adresse</dt><dd className="mt-2 text-xl font-semibold">{[store.address, store.city].filter(Boolean).join(", ")}</dd></div>}
            {!store.address && store.city && <div><dt className="label">Boutique</dt><dd className="mt-2 text-xl font-semibold">{store.city}</dd></div>}
            {store.phone && <div><dt className="label">Téléphone</dt><dd className="mt-2 text-xl font-semibold"><a href={`tel:+${toWhatsAppNumber(store.phone)}`}>{formatPhone(store.phone)}</a></dd></div>}
            {store.whatsapp && <div><dt className="label">WhatsApp</dt><dd className="mt-2 text-xl font-semibold">{formatPhone(store.whatsapp)}</dd></div>}
            {store.email && <div><dt className="label">E-mail</dt><dd className="mt-2 break-all text-xl font-semibold"><a href={`mailto:${store.email}`}>{store.email}</a></dd></div>}
            {store.opening_hours && <div><dt className="label">Horaires</dt><dd className="mt-2 text-ivory/90">{store.opening_hours}</dd></div>}
          </dl>
        </div>
        <div className="surface p-6 md:p-10">
          <h2 className="display mb-8 text-3xl">Écrivez-nous</h2>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
