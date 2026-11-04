"use client";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useRef } from "react";

export function Editorial({ image }: { image: string }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-12%", "12%"]);
  const x = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["6%", "-10%"]);

  return (
    <section ref={ref} className="relative overflow-hidden py-28 md:py-44">
      <motion.div style={{ y }} className="absolute inset-[-15%_0]">
        <Image src={image} alt="" fill sizes="100vw" className="object-cover opacity-30" />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/70 to-ink" />
      <div className="grain absolute inset-0" />

      <motion.p style={{ x }} aria-hidden className="display pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 whitespace-nowrap text-[24vw] italic leading-none text-ivory/[0.04]">
        Wouro Maama · Wouro Maama
      </motion.p>

      <div className="container-luxe relative text-center">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-4xl"
        >
          <p className="eyebrow">La Maison</p>
          <h2 className="display mt-8 text-5xl leading-[1.05] md:text-8xl">
            <span className="gold-text italic">Wouro Maama</span>
          </h2>
          <div className="mx-auto mt-10 h-px w-20 bg-gold/70" />
          <p className="display mx-auto mt-10 max-w-3xl text-2xl leading-relaxed text-ivory/85 md:text-[2.1rem] md:leading-[1.45]">
            Une allure ne s&apos;improvise pas, elle se compose. GOUNASS LUXURY réunit des pièces choisies avec exigence pour l&apos;homme
            et la femme qui font de leur style une signature.
          </p>
          <p className="mx-auto mt-8 max-w-xl text-sm leading-relaxed text-mist">
            Coupes nettes, détails maîtrisés, accessoires de caractère : chaque pièce est sélectionnée pour traverser les saisons et
            accompagner les moments qui comptent.
          </p>
          <Link href="/collections" className="btn btn-outline mt-12">Entrer dans l&apos;univers</Link>
        </motion.div>
      </div>
    </section>
  );
}
