import type { Metadata } from "next";
import { getSettings } from "@/lib/queries";
import { formatPhone } from "@/lib/format";
import { BRAND } from "@/lib/site";

export const metadata: Metadata = { title: "Conditions générales de vente" };

/* À compléter avec le NINEA et le RCCM dès leur obtention. */
export const revalidate = 300;

export default async function TermsPage() {
  const { store } = await getSettings();
  const contact = [store.email, store.phone && formatPhone(store.phone)].filter(Boolean).join(" · ");
  return (
    <article className="container-luxe max-w-3xl pt-16 text-sm leading-relaxed text-ivory/90 md:pt-24 [&_h2]:display [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-3xl [&_h2]:text-ivory">
      <h1 className="display text-center text-5xl text-ivory md:text-6xl">Conditions générales de vente</h1>
      <h2>Objet</h2>
      <p>Les présentes conditions régissent les ventes conclues sur la boutique en ligne {BRAND.name} {BRAND.tagline}, exploitée par {BRAND.legalName}. Toute commande implique leur acceptation.</p>
      <h2>Prix</h2>
      <p>Les prix sont indiqués en francs CFA (XOF), toutes taxes comprises. Les frais de livraison sont précisés avant la validation de la commande. Les prix et disponibilités sont vérifiés au moment de la validation.</p>
      <h2>Commande</h2>
      <p>Chaque commande reçoit un numéro unique. Un récapitulatif est présenté avant validation définitive. Une commande payée en ligne est confirmée à réception de la confirmation du prestataire de paiement.</p>
      <h2>Paiement</h2>
      <p>Moyens acceptés selon disponibilité : Wave, Orange Money, carte bancaire, paiement à la livraison. Aucune donnée bancaire n&apos;est stockée par la boutique.</p>
      <h2>Livraison</h2>
      <p>Les zones, tarifs et délais sont indiqués sur la page Livraison et lors de la commande. La livraison est offerte dès 10 000 FCFA d&apos;achat dans les zones concernées. Lorsque les frais dépendent de l&apos;adresse, ils sont confirmés au client avant l&apos;expédition. Les délais sont indicatifs.</p>
      <h2>Échanges et retours</h2>
      <p>Les articles peuvent être échangés dans un délai de 7 jours suivant la réception, à condition d&apos;être non utilisés, complets (accessoires, notices, câbles) et conservés dans leur emballage d&apos;origine, sous réserve des règles légales applicables. Pour toute demande, contactez le service client en précisant votre numéro de commande.</p>
      <h2>Informations légales</h2>
      <p>Nom commercial : {BRAND.legalName}. Boutique exclusivement en ligne — Sénégal. {contact ? `Contact : ${contact}.` : ""}</p>
      <p>NINEA et RCCM : en cours d&apos;immatriculation, communiqués dès leur obtention.</p>
    </article>
  );
}
