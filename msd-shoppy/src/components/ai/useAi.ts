"use client";
import { useState } from "react";

export interface AiState<T> { loading: boolean; result: T | null; error: string | null; usage: { used: number; quota: number } | null; cached: boolean }

/** Appel à /api/ai : la clé et le quota sont gérés côté serveur. */
export function useAi<T>(task: string) {
  const [state, set] = useState<AiState<T>>({ loading: false, result: null, error: null, usage: null, cached: false });
  async function run(input: unknown) {
    set((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task, input }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { set((s) => ({ ...s, loading: false, error: json.error ?? "Une erreur est survenue." })); return null; }
      set({ loading: false, result: json.result as T, error: null, usage: json.usage ?? null, cached: Boolean(json.cached) });
      return json.result as T;
    } catch {
      set((s) => ({ ...s, loading: false, error: "Connexion impossible. Vérifiez votre réseau." }));
      return null;
    }
  }
  return { ...state, run };
}
