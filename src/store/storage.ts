import type { StateStorage } from "zustand/middleware";

const memory: StateStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

/** Stockage local du navigateur ; inerte côté serveur (évite tout accès à localStorage pendant le rendu). */
export const browserStorage = (): StateStorage => {
  if (typeof window === "undefined") return memory;
  try {
    return window.localStorage;
  } catch {
    return memory;
  }
};
