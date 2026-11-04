import type { Metadata } from "next";

export const metadata: Metadata = { title: "Conditions générales de vente" };

/* Modèle à faire valider et compléter par le propriétaire (raison sociale, NINEA, RCCM, politique de retour). */
export default function TermsPage() {
  return (
    <article className="container-luxe max-w-3xl pt-16 text-sm leading-relaxed text-ivory/75 md:pt-24 [&_h2]:display [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-3xl [&_h2]:text-ivory">
      <h1 className="display text-center text-5xl text-ivory md:text-6xl">Conditions générales de vente</h1>
      <h2>Objet</h2>
      <p>Les présentes conditions régissent les ventes conclues sur la boutique en ligne GOUNASS LUXURY. Toute commande implique leur acceptation.</p>
      <h2>Prix</h2>
      <p>Les prix sont indiqués en francs CFA (XOF), toutes taxes comprises. Les frais de livraison sont précisés avant la validation de la commande. Les prix et disponibilités sont vérifiés au moment de la validation.</p>
      <h2>Commande</h2>
      <p>Chaque commande reçoit un numéro unique. Un récapitulatif est présenté avant validation définitive. Une commande payée en ligne est confirmée à réception de la confirmation du prestataire de paiement.</p>
      <h2>Paiement</h2>
      <p>Moyens acceptés selon disponibilité : Wave, Orange Money, carte bancaire, paiement à la livraison. Aucune donnée bancaire n&apos;est stockée par GOUNASS LUXURY.</p>
      <h2>Livraison</h2>
      <p>Les zones, tarifs et délais sont indiqués sur la page Livraison et lors de la commande. Les délais sont indicatifs.</p>
      <h2>Retours et réclamations</h2>
      <p>Pour toute réclamation, contactez le service client en précisant votre numéro de commande. Les modalités de retour et d&apos;échange sont communiquées par le service client.</p>
      <h2>Informations légales</h2>
      <p>Raison sociale, adresse du siège, NINEA et RCCM : à compléter par l&apos;exploitant de la boutique.</p>
    </article>
  );
}
