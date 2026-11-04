import { Reveal } from "@/components/ui/Reveal";
import { formatPrice } from "@/lib/format";

const items = (freeAbove: number | null, common: boolean) => [
  {
    title: "Livraison partout au Sénégal",
    text: freeAbove ? `Offerte dès ${formatPrice(freeAbove)} d'achat${common ? "" : " selon la zone"}` : "Tarif indiqué selon votre zone",
  },
  { title: "Paiement Wave ou à la livraison", text: "Commande confirmée après vérification" },
  { title: "Échange sous 7 jours", text: "Articles non portés, emballage d'origine" },
  { title: "Conseil sur WhatsApp", text: "Une question ? Notre équipe vous répond" },
];

/** Engagements réels de la boutique (fournis par le propriétaire). */
export function ServicesStrip({ freeAbove, common = true }: { freeAbove: number | null; common?: boolean }) {
  return (
    <section className="border-y border-white/[0.1] bg-ink-2">
      <div className="container-luxe grid grid-cols-2 divide-white/[0.1] lg:grid-cols-4 lg:divide-x">
        {items(freeAbove, common).map((it, i) => (
          <Reveal key={it.title} delay={i * 0.06} className="px-2 py-7 text-center lg:px-6 lg:py-9">
            <span className="mx-auto mb-4 block h-px w-8 bg-gold" />
            <p className="display text-lg leading-snug text-ivory md:text-xl">{it.title}</p>
            <p className="mt-2 text-[0.8rem] leading-relaxed text-mist">{it.text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
