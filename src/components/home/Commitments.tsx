"use client";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ChatIcon, ShieldIcon, TruckIcon, WalletIcon } from "@/components/ui/Icons";

/**
 * Engagements de la boutique, révélés au défilement le long d'une ligne lumineuse.
 * Les textes reprennent les engagements réels de la boutique (livraison, paiement,
 * échange, conseil) ; le seuil de livraison offerte vient des zones de la base.
 */
export function Commitments({ freeAbove, common }: { freeAbove: string | null; common: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });
  const line = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const items = [
    {
      icon: TruckIcon,
      title: "Livraison partout au Sénégal",
      text: freeAbove
        ? `Livraison offerte dès ${freeAbove} d'achat${common ? "" : " selon la zone"}. À Dakar et dans les régions du Sénégal.`
        : "Dakar et toutes les régions du Sénégal. Les frais et le délai de votre zone sont indiqués au moment de commander.",
      href: "/livraison",
      cta: "Zones et tarifs",
    },
    {
      icon: WalletIcon,
      title: "Payez comme vous voulez",
      text: "Wave, Orange Money ou en espèces à la livraison. Votre commande est confirmée dès que le paiement est vérifié.",
      href: "/faq#paiement",
      cta: "Moyens de paiement",
    },
    {
      icon: ShieldIcon,
      title: "Échange sous 7 jours",
      text: "Un souci avec votre produit ? Il peut être échangé sous 7 jours, s'il n'a pas été utilisé et qu'il est rendu complet dans son emballage d'origine.",
      href: "/garanties",
      cta: "Garanties et retours",
    },
    {
      icon: ChatIcon,
      title: "Un conseiller sur WhatsApp",
      text: "Compatibilité, capacité, couleur : posez vos questions avant d'acheter, ou passez votre commande directement dans la conversation.",
      href: "/contact",
      cta: "Nous écrire",
    },
  ];

  return (
    <section className="relative border-y border-white/[0.06] bg-ink-2/50 py-20 md:py-28" aria-labelledby="engagements">
      <div className="container-luxe grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <p className="eyebrow">Nos engagements</p>
          <h2 id="engagements" className="display mt-4 text-[2.1rem] sm:text-5xl md:text-6xl">
            Acheter en ligne, <span className="accent-text">en toute confiance.</span>
          </h2>
          <p className="mt-5 max-w-md leading-relaxed text-mist">
            Une commande simple, un paiement local et une équipe joignable à chaque étape, de la question avant l&apos;achat jusqu&apos;à la livraison.
          </p>
        </div>

        <div ref={ref} className="relative pl-8 md:pl-12">
          <div aria-hidden className="absolute bottom-0 left-[11px] top-0 w-px bg-white/10 md:left-[15px]" />
          <motion.div aria-hidden style={{ height: reduce ? "100%" : line }} className="absolute left-[11px] top-0 w-px bg-gradient-to-b from-accent via-glow to-accent shadow-[0_0_12px_rgba(126,164,255,.8)] md:left-[15px]" />
          <ol className="space-y-12 md:space-y-16">
            {items.map((it, i) => (
              <motion.li
                key={it.title}
                initial={reduce ? false : { opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.9, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
              >
                <span aria-hidden className="absolute -left-8 top-1 flex h-6 w-6 items-center justify-center rounded-full border border-accent/60 bg-ink text-[0.65rem] font-bold text-accent-light md:-left-12 md:h-8 md:w-8 md:text-xs">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="surface p-6 md:p-8">
                  <it.icon width={26} height={26} className="text-accent-light" />
                  <h3 className="display mt-5 text-2xl md:text-3xl">{it.title}</h3>
                  <p className="mt-3 leading-relaxed text-mist">{it.text}</p>
                  <Link href={it.href} className="link-luxe mt-5 text-sm font-semibold text-accent-light">
                    {it.cta}
                  </Link>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
