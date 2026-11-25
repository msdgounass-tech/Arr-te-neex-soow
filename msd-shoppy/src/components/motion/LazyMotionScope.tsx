"use client";
import { LazyMotion } from "motion/react";

const loadFeatures = () => import("@/lib/motion/features").then((m) => m.default);

/** Charge Motion (version complète, glisser inclus) à la demande, uniquement là où il sert. */
export function LazyMotionScope({ children }: { children: React.ReactNode }) {
  return <LazyMotion features={loadFeatures} strict>{children}</LazyMotion>;
}
