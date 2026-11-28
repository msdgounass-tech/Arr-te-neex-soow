"use client";
import { useState } from "react";
import { useAi } from "@/components/ai/useAi";
import { AiError, Thinking, UsageLine } from "@/components/ai/AiBits";

export type AdvisorOut = { answer: string; based_on: string[]; limits: string; next_steps: string[] };
const SUGGESTIONS = ["Quel produit devrais-je ajouter à ma boutique ?", "Pourquoi mes ventes diminuent-elles ?", "Quels sont mes produits les plus rentables ?",
  "Comment me différencier de mes concurrents ?", "Quel produit devrais-je promouvoir ?", "Comment augmenter mes commandes ?"];

export function AdvisorAnswer({ r }: { r: AdvisorOut }) {
  return (
    <div className="space-y-3 text-sm">
      <p className="whitespace-pre-line">{r.answer}</p>
      {r.next_steps.length > 0 && <div><b>À faire :</b><ol className="ml-4 mt-1 list-decimal">{r.next_steps.map((s) => <li key={s}>{s}</li>)}</ol></div>}
      {r.based_on.length > 0 && <p className="text-xs text-slate"><b>Données utilisées :</b> {r.based_on.join(" · ")}</p>}
      <p className="rounded-xl bg-mist p-2 text-xs text-slate"><b>Limites :</b> {r.limits}</p>
    </div>
  );
}

export function Advisor({ initial }: { initial?: string }) {
  const ai = useAi<AdvisorOut>("advisor");
  const [q, setQ] = useState(initial ?? "");
  return (
    <div className="space-y-4">
      <section className="card space-y-3 p-5">
        <label className="label" htmlFor="q">Votre question</label>
        <textarea id="q" className="field min-h-20" maxLength={600} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Posez votre question sur votre boutique…" />
        <div className="flex flex-wrap gap-2">{SUGGESTIONS.map((s) => <button key={s} type="button" className="chip press" onClick={() => setQ(s)}>{s}</button>)}</div>
        <button type="button" className="btn btn-primary press" disabled={ai.loading || q.trim().length < 3} onClick={() => void ai.run({ question: q })}>{ai.loading ? "Analyse en cours…" : "Demander à Shoppy AI"}</button>
        {ai.loading && <Thinking label="Shoppy AI analyse vos données…" />}<AiError message={ai.error} /><UsageLine usage={ai.usage} cached={ai.cached} />
      </section>
      {ai.result && <section className="card p-5" aria-live="polite"><AdvisorAnswer r={ai.result} /></section>}
    </div>
  );
}
