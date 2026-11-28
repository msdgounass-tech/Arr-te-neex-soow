"use client";
import { useState } from "react";
import { compressImage } from "@/lib/compress";
import { useAi } from "@/components/ai/useAi";
import { AiError, CopyBlock, Thinking, UsageLine } from "@/components/ai/AiBits";
import { Icon } from "@/components/ui/Icon";

type Out = { title: string; description: string; category: string | null; keywords: string[]; selling_points: string[]; to_verify: string[]; detected_product: string | null };
type Prod = { id: string; title: string; description: string; price: number };

async function toBase64(file: File) {
  const buf = new Uint8Array(await file.arrayBuffer());
  let bin = ""; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(bin);
}

export function ProductCreator({ products, categories, canTranslate }: { products: Prod[]; categories: Record<string, string>; canTranslate: boolean }) {
  const ai = useAi<Out>("product_content");
  const tr = useAi<{ text: string; note: string | null }>("translate");
  const [notes, setNotes] = useState(""); const [existing, setExisting] = useState("");
  const [photos, setPhotos] = useState<{ mediaType: "image/webp" | "image/jpeg" | "image/png"; data: string; url: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const MAX = 4;

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    setBusy(true);
    const added: typeof photos = [];
    for (const f of Array.from(list).slice(0, MAX - photos.length)) {
      if (!f.type.startsWith("image/")) continue;
      const { file } = await compressImage(f, 1024, 0.8);
      added.push({ mediaType: (["image/webp", "image/jpeg", "image/png"].includes(file.type) ? file.type : "image/jpeg") as "image/webp", data: await toBase64(file), url: URL.createObjectURL(file) });
    }
    setPhotos((p) => [...p, ...added].slice(0, MAX));
    setBusy(false);
  }
  function submit() {
    const p = products.find((x) => x.id === existing);
    void ai.run({ notes: [notes, p ? `Description actuelle : ${p.description}` : ""].filter(Boolean).join("\n"), title: p?.title ?? "", price: p?.price, images: photos.map(({ mediaType, data }) => ({ mediaType, data })) });
  }
  const r = ai.result;
  return (
    <div className="space-y-5">
      <section className="card space-y-4 p-5">
        <div>
          <span className="label">Photos du produit (jusqu'à {MAX}, recommandées)</span>
          {photos.length > 0 && (
            <ul className="mb-3 flex flex-wrap gap-2">{photos.map((ph, i) => (
              <li key={ph.url} className="relative">
                <img src={ph.url} alt={`Photo ${i + 1}`} className="h-20 w-20 rounded-xl object-cover" />
                <button type="button" aria-label={`Retirer la photo ${i + 1}`} onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                  className="press absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-ink text-white"><Icon name="x" size={14} /></button>
              </li>))}</ul>
          )}
          {photos.length < MAX && (
            <div className="flex flex-wrap gap-2">
              <label className="btn btn-secondary press cursor-pointer"><Icon name="image" size={18} /> Galerie
                <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { void onFiles(e.target.files); e.target.value = ""; }} /></label>
              <label className="btn btn-secondary press cursor-pointer"><Icon name="upload" size={18} /> Appareil photo
                <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => { void onFiles(e.target.files); e.target.value = ""; }} /></label>
            </div>
          )}
          {busy && <p className="mt-2 text-xs text-slate">Préparation des photos…</p>}
          <p className="mt-2 text-xs text-slate">Plusieurs angles (face, dos, détail, étiquette) aident Shoppy AI à mieux décrire le produit.</p>
        </div>
        {products.length > 0 && <div><label className="label" htmlFor="existing">Ou améliorer une fiche existante</label>
          <select id="existing" className="field" value={existing} onChange={(e) => setExisting(e.target.value)}>
            <option value="">— Nouveau produit —</option>{products.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>}
        <div><label className="label" htmlFor="notes">Ce que vous savez du produit</label>
          <textarea id="notes" className="field min-h-24" maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex. : sac en cuir de Ngaye, fait main, 3 couleurs, livraison Dakar 24 h" /></div>
        <button type="button" className="btn btn-primary press" disabled={ai.loading || busy} onClick={submit}>{ai.loading ? "Patientez…" : "Proposer une fiche"}</button>
        {ai.loading && <Thinking />}<AiError message={ai.error} /><UsageLine usage={ai.usage} cached={ai.cached} />
      </section>
      {r && (
        <section className="space-y-3" aria-live="polite">
          {r.detected_product && <p className="text-sm text-slate">Produit identifié sur la photo : <b className="text-ink">{r.detected_product}</b></p>}
          {r.to_verify.length > 0 && <div className="rounded-2xl bg-warning-soft p-3 text-sm text-warning"><b>À vérifier avant de publier :</b><ul className="ml-4 mt-1 list-disc">{r.to_verify.map((t) => <li key={t}>{t}</li>)}</ul></div>}
          <CopyBlock label="Titre" text={r.title} />
          <CopyBlock label="Description" text={r.description} onTranslate={canTranslate ? (t) => void tr.run({ text: r.description, target: t }) : undefined} />
          {tr.loading && <Thinking label="Traduction en cours…" />}<AiError message={tr.error} />
          {tr.result && <CopyBlock key={tr.result.text} label="Traduction" text={tr.result.text} />}
          {tr.result?.note && <p className="text-xs text-slate">{tr.result.note}</p>}
          <div className="card p-4 text-sm"><p><b>Catégorie proposée :</b> {r.category ? categories[r.category] ?? r.category : "aucune ne correspond"}</p>
            <p className="mt-2"><b>Mots-clés :</b> {r.keywords.join(", ")}</p>
            <p className="mt-2"><b>Arguments de vente :</b></p><ul className="ml-4 list-disc">{r.selling_points.map((s) => <li key={s}>{s}</li>)}</ul></div>
          <p className="text-sm text-slate">Copiez les textes dans votre <a href={existing ? `/vendeur/produits/${existing}` : "/vendeur/produits/nouveau"} className="link">fiche produit</a>, puis relisez-les : rien n'est publié sans vous.</p>
        </section>
      )}
    </div>
  );
}
