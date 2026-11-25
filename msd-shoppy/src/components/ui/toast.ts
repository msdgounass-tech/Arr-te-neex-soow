"use client";
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
    setTimeout(() => { items = items.filter((t) => t.id !== id); emit(); }, 400);
  },
};

export function toast(message: string, tone: ToastTone = "success", duration = 3500) {
  const id = ++seq;
  items = [...items.slice(-2), { id, message, tone, state: "open" }];
  emit();
  setTimeout(() => toastStore.dismiss(id), duration);
}
