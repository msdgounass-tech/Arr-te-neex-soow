import { dur, ease } from "./tokens";

/** Feuille du bas (mobile) : entre et sort par le bas, courbe de tiroir. */
export const sheetMotion = {
  initial: { y: "100%" },
  animate: { y: 0 },
  exit: { y: "100%", transition: { duration: dur.sheetExit, ease: ease.drawer } },
  transition: { duration: dur.sheet, ease: ease.drawer },
} as const;

/** Tiroir latéral (ordinateur). */
export const drawerMotion = {
  initial: { x: "100%" },
  animate: { x: 0 },
  exit: { x: "100%", transition: { duration: dur.sheetExit, ease: ease.drawer } },
  transition: { duration: dur.sheet, ease: ease.drawer },
} as const;

/** Voile derrière une feuille : opacité seule, même durée que le panneau à l'entrée et à la sortie. */
export const backdropMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: dur.sheetExit, ease: ease.out } },
  transition: { duration: dur.sheet, ease: ease.out },
} as const;

/** Mouvement réduit : voile à la même durée que le panneau. */
export const backdropFadeMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: dur.sheetExit, ease: ease.out } },
  transition: { duration: dur.base, ease: ease.out },
} as const;

/** Mouvement réduit : la feuille apparaît en fondu, sans glissement. */
export const sheetFadeMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: dur.sheetExit, ease: ease.out } },
  transition: { duration: dur.base, ease: ease.out },
} as const;

/** Étapes d'un guide : glissement court dans le sens de la navigation (custom = 1 suivant, -1 précédent), flou léger pour fondre le fondu enchaîné. */
export const stepVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 16, filter: "blur(2px)" }),
  center: { opacity: 1, x: 0, filter: "blur(0px)" },
  exit: (dir: number) => ({ opacity: 0, x: dir * -16, filter: "blur(2px)" }),
};
export const stepTransition = { duration: dur.base, ease: ease.out } as const;

/** Vitesse (px/s) au-delà de laquelle un glissement ferme la feuille (≈ 0,11 px/ms). */
export const DISMISS_VELOCITY = 110;
export const DISMISS_DISTANCE = 120;
