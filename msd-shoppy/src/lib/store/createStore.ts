"use client";
import { useSyncExternalStore } from "react";

/** Petit magasin d'état persistant (localStorage), sans dépendance. */
export function createPersistentStore<T>(key: string, initial: T) {
  let state = initial;
  let hydrated = false;
  const listeners = new Set<() => void>();
  const read = () => {
    if (hydrated || typeof window === "undefined") return;
    hydrated = true;
    try { const raw = localStorage.getItem(key); if (raw) state = JSON.parse(raw) as T; } catch { /* stockage indisponible */ }
  };
  const store = {
    get: () => { read(); return state; },
    set(next: T | ((s: T) => T)) {
      read();
      state = typeof next === "function" ? (next as (s: T) => T)(state) : next;
      try { localStorage.setItem(key, JSON.stringify(state)); } catch { /* stockage plein ou bloqué */ }
      listeners.forEach((l) => l());
    },
    subscribe(l: () => void) {
      listeners.add(l);
      const onStorage = (e: StorageEvent) => { if (e.key === key) { hydrated = false; read(); l(); } };
      window.addEventListener("storage", onStorage);
      return () => { listeners.delete(l); window.removeEventListener("storage", onStorage); };
    },
  };
  const useStore = () => useSyncExternalStore(store.subscribe, store.get, () => initial);
  return { store, useStore };
}
