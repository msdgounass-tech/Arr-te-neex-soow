import { dur, ease } from "./tokens";

/** Feuille du bas (mobile) : entre et sort par le bas, courbe de tiroir. */
export const sheetMotion = {
  initial: { y: "100%" },
  animate: { y: 0 },
  exit: { y: "100%" },
  transition: { duration: dur.sheet, ease: ease.drawer },
} as const;

/** Tiroir latéral (ordinateur). */
export const drawerMotion = {
  initial: { x: "100%" },
  animate: { x: 0 },
  exit: { x: "100%" },
  transition: { duration: dur.sheet, ease: ease.drawer },
} as const;

/** Voile derrière une feuille ou une fenêtre : opacité seule. */
export const backdropMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: dur.base, ease: ease.out },
} as const;

/** Étapes d'un guide : glissement horizontal court. */
export const stepMotion = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
  transition: { duration: dur.base, ease: ease.inOut },
} as const;

/** Vitesse (px/s) au-delà de laquelle un glissement ferme la feuille (≈ 0,11 px/ms). */
export const DISMISS_VELOCITY = 110;
export const DISMISS_DISTANCE = 120;
