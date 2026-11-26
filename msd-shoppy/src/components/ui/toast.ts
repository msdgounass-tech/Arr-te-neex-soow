"use client";
import { dur } from "@/lib/motion/tokens";
const EXIT_MS = dur.toast * 1000;
// Petite file de notifications sans bibliothèque : useSyncExternalStore + transitions CSS.
export type ToastTone = "success" | "error" | "info";
export interface ToastItem { id: number; message: string; tone: ToastTone; state: "open" | "closing" }

let items: ToastItem[] = [];
let seq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const toastStore = {
  subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); },
  get: () => items,
  server: (): ToastItem[] => [],
  dismiss(id: number) {
    items = items.map((t) => (t.id === id ? { ...t, state: "closing" } : t)); emit();
    setTimeout(() => { items = items.filter((t) => t.id !== id); emit(); }, EXIT_MS);
  },
};

export function toast(message: string, tone: ToastTone = "success", duration = 3500) {
  const id = ++seq;
  items = [...items, { id, message, tone, state: "open" }];
  emit();
  const open = items.filter((t) => t.state === "open");
  if (open.length > 3) toastStore.dismiss(open[0].id); // le plus ancien sort en animation, sans saut
  setTimeout(() => toastStore.dismiss(id), duration);
}
