"use client";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { BrandLogo } from "@/components/brand/Logo";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero({ image, logoUrl }: { image: string; logoUrl?: string }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "18%"]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const item = (d: number) => ({
    initial: reduce ? false : { opacity: 0, y: 26 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 1.3, delay: d, ease },
  });

  return (
    <section ref={ref} className="relative -mt-[72px] h-[100svh] min-h-[640px] overflow-hidden bg-ink lg:-mt-[84px]">
      <motion.div style={{ y }} className="absolute inset-0">
        <motion.div
          className="absolute inset-0"
          initial={reduce ? false : { scale: 1.14, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2.6, ease }}
        >
          <Image src={image} alt="Mannequins GOUNASS LUXURY en grand boubou et tenue africaine brodés or" fill priority sizes="100vw" className="object-cover object-[80%_center] md:object-[70%_center]" />
        </motion.div>
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/30 to-transparent md:from-ink/80 md:via-ink/15" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/30" />
      

      <motion.div style={{ opacity: fade }} className="container-luxe relative flex h-full flex-col justify-end pb-20 md:justify-center md:pb-0">
        <div className="max-w-2xl pt-24">
          <motion.div {...item(0.5)} className="flex items-center gap-4">
            <BrandLogo size={112} src={logoUrl} priority className="h-20 w-20 shadow-[0_10px_40px_-10px_rgba(198,161,92,.55)] ring-1 ring-gold/50 md:h-28 md:w-28" />
            <div className="leading-none">
              <p className="text-[0.74rem] tracking-[0.5em] text-ivory">GOUNASS LUXURY</p>
              <p className="gold-text animate-shimmer mt-2 text-[0.74rem] font-semibold tracking-[0.62em]">WOURO MAAMA</p>
            </div>
          </motion.div>

          <motion.h1 {...item(0.75)} className="display mt-8 text-[3.1rem] leading-[0.98] [text-shadow:0_2px_14px_rgba(0,0,0,.35)] sm:text-7xl lg:text-[6.2rem]">
            L&apos;élégance est
            <br />
            une <em className="gold-text not-italic md:italic">signature.</em>
          </motion.h1>

          <motion.div initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.4, delay: 1.1, ease }} className="mt-8 h-px w-24 origin-left bg-gold" />

          <motion.p {...item(1.05)} className="mt-8 max-w-md text-[1.05rem] font-medium leading-relaxed text-ivory [text-shadow:0_1px_8px_rgba(0,0,0,.35)] md:text-lg">
            Découvrez une sélection exclusive de vêtements et d&apos;accessoires pour affirmer votre style.
          </motion.p>

          <motion.div {...item(1.3)} className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link href="/collections" className="btn btn-gold">Découvrir la collection</Link>
            <Link href="/shop" className="btn btn-outline">Explorer la boutique</Link>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 1 }}
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex [@media(max-height:900px)]:!hidden"
        aria-hidden
      >
        <span className="text-[0.68rem] uppercase tracking-[0.5em] text-ivory/90">Défiler</span>
        <span className="relative h-12 w-px overflow-hidden bg-ivory/15">
          <motion.span
            className="absolute inset-x-0 top-0 h-1/2 bg-gold"
            animate={{ y: ["-100%", "200%"] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </span>
      </motion.div>
    </section>
  );
}
