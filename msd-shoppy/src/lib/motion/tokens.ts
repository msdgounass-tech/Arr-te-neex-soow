// Mêmes valeurs que src/styles/motion.css (vérifié par tests/unit/motion-tokens.test.ts).
export const ease = {
  out: [0.23, 1, 0.32, 1],
  inOut: [0.77, 0, 0.175, 1],
  drawer: [0.32, 0.72, 0, 1],
} as const;

export const dur = {
  press: 0.16,
  fast: 0.15,
  base: 0.2,
  reveal: 0.3,
  modal: 0.3,
  sheet: 0.4,
  sheetExit: 0.25,
  toast: 0.4,
  stagger: 0.05,
} as const;
