"use client";
import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Vrai après le premier affichage : seules les navigations internes sont animées.
let hydrated = false;

/**
 * Transition douce entre les pages (fondu + léger glissement).
 * Au premier chargement, le contenu rendu par le serveur est visible immédiatement
 * (aucune opacité nulle en attendant JavaScript), ce qui préserve le LCP.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const animate = hydrated && !reduce;
  useEffect(() => {
    hydrated = true;
  }, []);
  return (
    <motion.div
      key={pathname}
      initial={animate ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
