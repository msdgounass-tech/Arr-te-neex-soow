"use client";
import Link from "next/link";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { Fragment, useRef } from "react";
import { ArrowRight, ChatIcon, TruckIcon, WalletIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { PhoneStage } from "./hero/PhoneStage";

const TITLE: { text: string; accent?: boolean }[][] = [
  [{ text: "La" }, { text: "technologie," }],
  [{ text: "en" }, { text: "version", accent: true }, { text: "premium.", accent: true }],
];

export function Hero({ whatsapp, freeAbove }: { whatsapp?: string; freeAbove?: string | null }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = Boolean(useReducedMotion());
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "-30%"]);
  const textFade = useTransform(scrollYProgress, [0, 0.55], [1, 0]);

  // Halo lumineux qui suit le pointeur
  const mx = useMotionValue(70);
  const my = useMotionValue(40);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });
  const halo = useMotionTemplate`radial-gradient(600px circle at ${sx}% ${sy}%, rgba(126,164,255,.16), transparent 60%)`;
  const onMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 100);
    my.set(((e.clientY - r.top) / r.height) * 100);
  };

  const wa = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent("Bonjour, je souhaite commander un produit vu sur votre boutique.")}`
    : null;

  let w = 0;
  return (
    <section
      ref={ref}
      onPointerMove={onMove}
      className="relative -mt-16 overflow-hidden lg:-mt-[72px]"
      aria-labelledby="hero-title"
    >
      {/* Profondeur : grille technique, halos, faisceaux */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="tech-grid absolute inset-0 opacity-70" />
        <motion.div className="absolute inset-0" style={{ background: halo }} />
        <div className="absolute -right-40 top-10 h-[48rem] w-[48rem] bg-[radial-gradient(closest-side,rgba(126,164,255,.26),transparent)] lg:right-0" />
        <div className="absolute -left-40 bottom-0 h-[36rem] w-[36rem] bg-[radial-gradient(closest-side,rgba(99,230,210,.12),transparent)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />
      </div>

      <div className="container-luxe relative grid min-h-[100svh] items-center gap-2 pb-10 pt-20 lg:grid-cols-[1.1fr_1fr] lg:gap-8 lg:pb-16 lg:pt-28">
        <motion.div style={{ y: textY, opacity: textFade }} className="relative z-10 order-2 max-w-2xl lg:order-1">
          <p className="eyebrow anim-rise" style={{ animationDelay: "0.1s" }}>
            Boutique high-tech · Sénégal
          </p>

          <h1 id="hero-title" className="display mt-6 text-[2.6rem] leading-[0.98] sm:text-6xl lg:text-[4.4rem] xl:text-[5.2rem] 2xl:text-[5.8rem]">
            {TITLE.map((line, li) => (
              <span key={li} className="block overflow-hidden pb-[0.08em]">
                {line.map((word) => {
                  const d = 0.04 + w++ * 0.04;
                  return (
                    <Fragment key={word.text}>
                    <span className="anim-word inline-block" style={{ animationDelay: `${d}s` }}>
                      <span className={word.accent ? "accent-text" : undefined}>{word.text}</span>
                    </span>{" "}
                    </Fragment>
                  );
                })}
              </span>
            ))}
          </h1>

          <p className="anim-rise mt-5 max-w-lg text-base leading-relaxed text-ivory/80 md:mt-6 md:text-lg" style={{ animationDelay: "0.45s" }}>
            Smartphones, ordinateurs, audio et objets connectés, sélectionnés avec exigence. Prix clairs en FCFA, conseil personnalisé
            et livraison à Dakar comme dans les régions.
          </p>

          <div className="anim-rise mt-9 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "0.6s" }}>
            <Link href="/shop" className="btn btn-primary group">
              Découvrir nos produits
              <ArrowRight width={18} height={18} className="transition-transform duration-500 group-hover:translate-x-1" />
            </Link>
            {wa ? (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                <WhatsAppIcon width={20} height={20} />
                Commander sur WhatsApp
              </a>
            ) : (
              <Link href="/contact" className="btn btn-outline">Nous contacter</Link>
            )}
          </div>

          <ul className="anim-rise mt-10 grid max-w-xl grid-cols-1 gap-3 text-sm text-mist sm:grid-cols-3" style={{ animationDelay: "0.8s" }}>
            <li className="flex items-center gap-2.5"><TruckIcon width={18} height={18} className="shrink-0 text-accent-light" />{freeAbove ? `Livraison offerte dès ${freeAbove}` : "Livraison partout au Sénégal"}</li>
            <li className="flex items-center gap-2.5"><WalletIcon width={18} height={18} className="shrink-0 text-accent-light" />Wave, Orange Money ou à la livraison</li>
            <li className="flex items-center gap-2.5"><ChatIcon width={18} height={18} className="shrink-0 text-accent-light" />Conseil et commande sur WhatsApp</li>
          </ul>
        </motion.div>

        <div
          className="anim-stage relative order-1 h-[40svh] min-h-[300px] w-full lg:order-2 lg:h-[86svh] lg:max-h-[860px]"
        >
          {/* socle lumineux */}
          <div aria-hidden className="absolute bottom-[12%] left-1/2 h-16 w-[55%] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(126,164,255,.45),transparent)]" />
          <PhoneStage progress={progress} reduce={reduce} />
        </div>
      </div>
    </section>
  );
}
