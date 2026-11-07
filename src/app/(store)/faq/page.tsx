import type { Metadata } from "next";
import Link from "next/link";
import { getDeliveryZones, getSettings } from "@/lib/queries";
import { commonFreeThreshold } from "@/lib/delivery";
import { formatPrice, toWhatsAppNumber } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { WhatsAppIcon } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Questions fréquentes",
  description: "Commande, paiement Wave et Orange Money, livraison à Dakar et au Sénégal, échange et garantie : les réponses à vos questions.",
  alternates: { canonical: "/faq" },
};
export const revalidate = 300;

type QA = { q: string; a: React.ReactNode; text: string };

export default async function FaqPage() {
  const [{ store }, zones] = await Promise.all([getSettings(), getDeliveryZones()]);
  const free = commonFreeThreshold(zones);
  const wa = toWhatsAppNumber(store.whatsapp);

  const groups: { id: string; title: string; items: QA[] }[] = [
    {
      id: "commande",
      title: "Commander",
      items: [
        {
          q: "Comment passer commande ?",
          text: "Ajoutez vos produits au panier, puis renseignez vos coordonnées, votre adresse et votre zone de livraison. Un récapitulatif complet s'affiche avant la validation définitive. Vous pouvez aussi commander directement sur WhatsApp depuis chaque fiche produit.",
          a: (
            <>
              Ajoutez vos produits au panier, puis renseignez vos coordonnées, votre adresse et votre zone de livraison. Un récapitulatif complet s&apos;affiche avant la
              validation définitive. Vous pouvez aussi commander directement sur WhatsApp grâce au bouton « Commander sur WhatsApp » de chaque fiche produit.
            </>
          ),
        },
        {
          q: "Comment suivre ma commande ?",
          text: "Chaque commande reçoit un numéro unique. Retrouvez son statut sur la page Suivre une commande, ou dans votre espace client si vous avez un compte.",
          a: (
            <>
              Chaque commande reçoit un numéro unique. Retrouvez son statut sur la page <Link href="/suivi" className="text-accent-light hover:underline">Suivre une commande</Link>, ou dans
              votre <Link href="/compte/commandes" className="text-accent-light hover:underline">espace client</Link> si vous avez un compte.
            </>
          ),
        },
        {
          q: "Faut-il créer un compte ?",
          text: "Non. Le compte est facultatif : il permet de retrouver vos commandes, vos adresses et vos favoris sur tous vos appareils.",
          a: <>Non. Le compte est facultatif : il permet de retrouver vos commandes, vos adresses et vos favoris sur tous vos appareils.</>,
        },
      ],
    },
    {
      id: "paiement",
      title: "Paiement",
      items: [
        {
          q: "Quels moyens de paiement acceptez-vous ?",
          text: "Wave, Orange Money et le paiement en espèces à la livraison, selon les moyens proposés au moment de la commande.",
          a: <>Wave, Orange Money et le paiement en espèces à la livraison, selon les moyens proposés au moment de la commande.</>,
        },
        {
          q: "Quand ma commande est-elle confirmée ?",
          text: "Une commande payée par Wave ou Orange Money est confirmée dès que l'équipe a vérifié la réception du paiement. Avec le paiement à la livraison, vous réglez à la réception du colis.",
          a: (
            <>
              Une commande payée par Wave ou Orange Money est confirmée dès que l&apos;équipe a vérifié la réception du paiement. Avec le paiement à la livraison, vous réglez à la
              réception du colis.
            </>
          ),
        },
        {
          q: "Les prix incluent-ils les taxes ?",
          text: "Oui. Les prix sont affichés en francs CFA (XOF), toutes taxes comprises. Les frais de livraison sont indiqués avant la validation.",
          a: <>Oui. Les prix sont affichés en francs CFA (XOF), toutes taxes comprises. Les frais de livraison sont indiqués avant la validation.</>,
        },
      ],
    },
    {
      id: "livraison",
      title: "Livraison",
      items: [
        {
          q: "Livrez-vous en dehors de Dakar ?",
          text: "Oui, la boutique livre à Dakar et dans les régions du Sénégal. Les zones, tarifs et délais sont détaillés sur la page Livraison.",
          a: (
            <>
              Oui, la boutique livre à Dakar et dans les régions du Sénégal. Les zones, tarifs et délais sont détaillés sur la page{" "}
              <Link href="/livraison" className="text-accent-light hover:underline">Livraison</Link>.
            </>
          ),
        },
        {
          q: "La livraison est-elle gratuite ?",
          text: free ? `La livraison est offerte dès ${formatPrice(free)} d'achat. En dessous, les frais de votre zone sont indiqués lors de la commande.` : "Les frais dépendent de votre zone ; ils sont indiqués lors de la commande ou confirmés par notre équipe avant l'expédition.",
          a: free ? (
            <>La livraison est offerte dès {formatPrice(free)} d&apos;achat. En dessous, les frais de votre zone sont indiqués lors de la commande.</>
          ) : (
            <>Les frais dépendent de votre zone ; ils sont indiqués lors de la commande ou confirmés par notre équipe avant l&apos;expédition.</>
          ),
        },
      ],
    },
    {
      id: "garantie",
      title: "Produits, garantie & échange",
      items: [
        {
          q: "Puis-je échanger un produit ?",
          text: "Oui, sous 7 jours après réception, si le produit n'a pas été utilisé et qu'il est rendu complet dans son emballage d'origine.",
          a: (
            <>
              Oui, sous 7 jours après réception, si le produit n&apos;a pas été utilisé et qu&apos;il est rendu complet dans son emballage d&apos;origine.{" "}
              <Link href="/garanties" className="text-accent-light hover:underline">Voir les conditions</Link>.
            </>
          ),
        },
        {
          q: "Quelle garantie s'applique à mon produit ?",
          text: "La garantie dépend du produit et de sa marque. Elle vous est précisée sur demande avant l'achat ; conservez votre reçu de commande, il sert de preuve d'achat.",
          a: (
            <>
              La garantie dépend du produit et de sa marque. Elle vous est précisée sur demande avant l&apos;achat ; conservez votre reçu de commande, il sert de preuve d&apos;achat.
            </>
          ),
        },
        {
          q: "Comment savoir si un produit est compatible avec mon appareil ?",
          text: "Consultez les caractéristiques techniques de la fiche produit, ou écrivez-nous sur WhatsApp en précisant le modèle de votre appareil.",
          a: <>Consultez les caractéristiques techniques de la fiche produit, ou écrivez-nous sur WhatsApp en précisant le modèle de votre appareil.</>,
        },
      ],
    },
  ];

  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: groups.flatMap((g) => g.items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.text } }))),
  };

  return (
    <div className="container-luxe max-w-5xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <PageHeader eyebrow="Aide" title="Questions fréquentes" intro="Tout ce qu'il faut savoir pour commander, payer et être livré sereinement." />

      <nav aria-label="Rubriques" className="mb-10 flex flex-wrap gap-2">
        {groups.map((g) => (
          <a key={g.id} href={`#${g.id}`} className="chip">{g.title}</a>
        ))}
      </nav>

      <div className="space-y-12">
        {groups.map((g) => (
          <section key={g.id} id={g.id} className="scroll-mt-28" aria-labelledby={`t-${g.id}`}>
            <h2 id={`t-${g.id}`} className="display text-2xl md:text-3xl">{g.title}</h2>
            <div className="surface mt-5 divide-y divide-white/[0.06] overflow-hidden">
              {g.items.map((i) => (
                <details key={i.q} className="group px-5 md:px-7">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-semibold">
                    {i.q}
                    <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/12 text-accent-light transition-transform duration-300 group-open:rotate-45">+</span>
                  </summary>
                  <p className="pb-6 leading-relaxed text-ivory/80">{i.a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="surface mt-16 flex flex-col items-start justify-between gap-6 p-6 md:flex-row md:items-center md:p-8">
        <div>
          <p className="display text-2xl">Vous ne trouvez pas votre réponse ?</p>
          <p className="mt-2 text-mist">Notre équipe vous répond sur WhatsApp ou via le formulaire de contact.</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          {wa && (
            <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
              <WhatsAppIcon width={20} height={20} /> WhatsApp
            </a>
          )}
          <Link href="/contact" className="btn btn-outline">Formulaire de contact</Link>
        </div>
      </div>
    </div>
  );
}
