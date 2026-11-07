"use client";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { BRAND } from "@/lib/site";

/** Bouton WhatsApp flottant : ouvre une conversation avec la boutique (numéro configuré dans l'admin). */
export function WhatsAppFloat({ number }: { number: string }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const home = pathname === "/";
  // Sur l'accueil, le bouton n'apparaît qu'après le Hero (qui a déjà son bouton WhatsApp).
  const [past, setPast] = useState(!home);
  useEffect(() => {
    if (!home) return setPast(true);
    const onScroll = () => setPast(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [home]);
  if (!number || pathname.startsWith("/commande") || pathname.startsWith("/produit/")) return null;
  const text = encodeURIComponent(`Bonjour ${BRAND.name}, j'ai une question sur un produit de la boutique.`);
  return (
    <AnimatePresence>
    {past && (
    <motion.a
      initial={reduce ? false : { scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ delay: home ? 0 : 1.2, type: "spring", stiffness: 260, damping: 18 }}
      href={`https://wa.me/${number}?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Écrire à ${BRAND.name} sur WhatsApp`}
      className="group fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-[70] flex h-12 items-center gap-0 rounded-full md:h-14 bg-[#1fa855] pl-4 pr-4 text-white shadow-[0_14px_40px_-10px_rgba(31,168,85,.7)] ring-1 ring-white/20 transition-[gap,padding] duration-500 hover:gap-2.5 hover:pr-5 md:bottom-7 md:right-7"
    >
      <WhatsAppIcon width={26} height={26} />
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-bold transition-[max-width] duration-500 group-hover:max-w-[8rem]">Une question ?</span>
    </motion.a>
    )}
    </AnimatePresence>
  );
}
