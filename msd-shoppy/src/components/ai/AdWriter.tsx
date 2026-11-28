"use client";
import { useState } from "react";
import { useAi } from "@/components/ai/useAi";
import { AiError, CopyBlock, Thinking, UsageLine } from "@/components/ai/AiBits";

type Out = { whatsapp: string; facebook: string; instagram: string; variants: string[]; video: { hook: string; scenes: string[]; voiceover: string }; audience: string[]; visual_tips: string[] };

export function AdWriter({ products, initial, canTranslate }: { products: { id: string; title: string }[]; initial?: string; canTranslate: boolean }) {
  const ai = useAi<Out>("ad_copy");
  const tr = useAi<{ text: string; note: string | null }>("translate");
  const [productId, setProductId] = useState(initial && products.some((p) => p.id === initial) ? initial : products[0]?.id ?? "");
  const [brief, setBrief] = useState("");
  const r = ai.result;
  const translate = (text: string) => canTranslate ? (t: "en" | "wo" | "fr") => void tr.run({ text, target: t }) : undefined;
  return (
    <div className="space-y-5">
      <section className="card space-y-4 p-5">
        <div><label className="label" htmlFor="product">Produit à promouvoir</label>
          <select id="product" className="field" value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="">— Aucun (message général pour la boutique) —</option>{products.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
        <div><label className="label" htmlFor="brief">Votre message (offre, ton, occasion)</label>
          <textarea id="brief" className="field min-h-20" maxLength={1500} value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="Ex. : spécial Tabaski, livraison offerte à Dakar jusqu'à dimanche" /></div>
        <button type="button" className="btn btn-primary press" disabled={ai.loading} onClick={() => void ai.run({ productId: productId || undefined, brief })}>{ai.loading ? "Patientez…" : "Préparer mes publicités"}</button>
        {ai.loading && <Thinking />}<AiError message={ai.error} /><UsageLine usage={ai.usage} cached={ai.cached} />
      </section>
      {r && (
        <section className="space-y-3" aria-live="polite">
          <CopyBlock label="WhatsApp" text={r.whatsapp} onTranslate={translate(r.whatsapp)} />
          <CopyBlock label="Facebook" text={r.facebook} onTranslate={translate(r.facebook)} />
          <CopyBlock label="Instagram" text={r.instagram} onTranslate={translate(r.instagram)} />
          {tr.loading && <Thinking label="Traduction en cours…" />}<AiError message={tr.error} />
          {tr.result && <CopyBlock key={tr.result.text} label="Traduction" text={tr.result.text} />}
          <div className="card space-y-2 p-4 text-sm"><b>Accroches alternatives</b><ul className="ml-4 list-disc">{r.variants.map((v) => <li key={v}>{v}</li>)}</ul></div>
          <div className="card space-y-2 p-4 text-sm"><b>Vidéo courte (à filmer au téléphone)</b><p><b>Accroche :</b> {r.video.hook}</p>
            <ol className="ml-4 list-decimal">{r.video.scenes.map((s) => <li key={s}>{s}</li>)}</ol>
            <CopyBlock label="Voix off" text={r.video.voiceover} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="card p-4 text-sm"><b>Publics à viser</b><ul className="ml-4 mt-1 list-disc">{r.audience.map((a) => <li key={a}>{a}</li>)}</ul></div>
            <div className="card p-4 text-sm"><b>Conseils visuels</b><ul className="ml-4 mt-1 list-disc">{r.visual_tips.map((a) => <li key={a}>{a}</li>)}</ul></div>
          </div>
          <p className="text-xs text-slate">Shoppy AI prépare les textes ; c'est vous qui publiez. Pour une publicité payante Facebook, utilisez « Promouvoir sur Facebook » dans l'espace Promotion.</p>
        </section>
      )}
    </div>
  );
}
