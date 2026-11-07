import Link from "next/link";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { Reveal } from "@/components/ui/Reveal";

/** Bandeau d'appel au conseil : une question avant d'acheter ? */
export function WhatsAppBand({ whatsapp }: { whatsapp: string }) {
  const href = whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent("Bonjour, j'aimerais un conseil avant d'acheter.")}` : "/contact";
  return (
    <section className="container-luxe py-16 md:py-24">
      <Reveal className="surface relative overflow-hidden px-6 py-14 md:px-16 md:py-20">
        <div aria-hidden className="tech-grid absolute inset-0 opacity-60" />
        <div aria-hidden className="absolute -right-24 -top-24 h-80 w-80 bg-[radial-gradient(closest-side,rgba(31,168,85,.28),transparent)]" />
        <div aria-hidden className="absolute -bottom-32 left-10 h-72 w-72 bg-[radial-gradient(closest-side,rgba(126,164,255,.18),transparent)]" />
        <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <p className="eyebrow">Conseil personnalisé</p>
            <h2 className="display mt-4 text-[2rem] sm:text-5xl">Une question avant d&apos;acheter ?</h2>
            <p className="mt-4 leading-relaxed text-mist">
              Disponibilité, compatibilité, choix de la capacité ou de la couleur : écrivez-nous, un conseiller vous répond et peut prendre votre commande directement.
            </p>
          </div>
          {whatsapp ? (
            <a href={href} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp w-full shrink-0 sm:w-auto">
              <WhatsAppIcon width={20} height={20} /> Écrire sur WhatsApp
            </a>
          ) : (
            <Link href={href} className="btn btn-primary w-full shrink-0 sm:w-auto">Nous contacter</Link>
          )}
        </div>
      </Reveal>
    </section>
  );
}
