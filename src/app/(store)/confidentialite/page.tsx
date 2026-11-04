import type { Metadata } from "next";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function PrivacyPage() {
  return (
    <article className="container-luxe max-w-3xl pt-16 text-sm leading-relaxed text-ivory/90 md:pt-24 [&_h2]:display [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-3xl [&_h2]:text-ivory">
      <h1 className="display text-center text-5xl text-ivory md:text-6xl">Confidentialité</h1>
      <h2>Données collectées</h2>
      <p>Nom, téléphone, numéro WhatsApp, e-mail, adresse de livraison et contenu des commandes ; pour les comptes clients, également les adresses enregistrées et les favoris.</p>
      <h2>Utilisation</h2>
      <p>Ces données servent exclusivement au traitement et à la livraison des commandes, au service client et, si vous y avez consenti, à la newsletter.</p>
      <h2>Paiements</h2>
      <p>Les paiements sont traités par les prestataires (Wave, Orange Money, Stripe). Aucune donnée de carte bancaire ne transite par nos serveurs.</p>
      <h2>Sécurité</h2>
      <p>Les données sont hébergées sur une base PostgreSQL protégée par des règles d&apos;accès par ligne : chaque client n&apos;accède qu&apos;à ses propres informations.</p>
      <h2>Vos droits</h2>
      <p>Conformément à la loi sénégalaise n° 2008-12 sur la protection des données à caractère personnel, vous pouvez demander l&apos;accès, la rectification ou la suppression de vos données via la page Contact.</p>
    </article>
  );
}
