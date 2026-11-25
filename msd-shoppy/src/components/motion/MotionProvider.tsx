"use client";
import { MotionConfig } from "motion/react";

/** Réglage global : respecte « réduire les animations ». Motion n'est chargé que par les composants qui l'utilisent. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
