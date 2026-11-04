"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveCollection } from "@/app/admin/actions";
import { ImageField } from "./ImageField";

type C = { id?: string; name: string; tagline: string; description: string; image_url: string; is_featured: boolean; is_exclusive: boolean; is_active: boolean; position: number };

export function CollectionEditor({ initial }: { initial?: Partial<C> & { id: string } }) {
  const router = useRouter();
  const [c, setC] = useState<C>({ name: "", tagline: "", description: "", image_url: "", is_featured: false, is_exclusive: false, is_active: true, position: 0, ...(initial as Partial<C>) } as C);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof C, v: string | boolean | number) => setC((s) => ({ ...s, [k]: v }));
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const r = await saveCollection({ ...c, tagline: c.tagline || "", description: c.description || "", image_url: c.image_url || null });
        setBusy(false);
        setMsg(r.error || r.message || "");
        if (r.ok) {
          if (!initial) setC({ name: "", tagline: "", description: "", image_url: "", is_featured: false, is_exclusive: false, is_active: true, position: 0 });
          router.refresh();
        }
      }}
      className="grid gap-4 md:grid-cols-2"
    >
      <label><span className="label">Nom</span><input required value={c.name} onChange={(e) => set("name", e.target.value)} className="field-box mt-1" /></label>
      <label><span className="label">Accroche</span><input value={c.tagline || ""} onChange={(e) => set("tagline", e.target.value)} className="field-box mt-1" /></label>
      <label className="md:col-span-2"><span className="label">Description</span><textarea rows={3} value={c.description || ""} onChange={(e) => set("description", e.target.value)} className="field-box mt-1" /></label>
      <ImageField label="Visuel de la collection" value={c.image_url || ""} onChange={(u) => set("image_url", u)} bucket="site" folder="collections" />
      <div className="space-y-3 text-sm">
        <label className="block"><span className="label">Ordre d&apos;affichage</span><input type="number" value={c.position} onChange={(e) => set("position", Number(e.target.value))} className="field-box mt-1 w-24" /></label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={c.is_active} onChange={(e) => set("is_active", e.target.checked)} className="accent-[#C6A15B]" /> Visible</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={c.is_featured} onChange={(e) => set("is_featured", e.target.checked)} className="accent-[#C6A15B]" /> Collection vedette (page d&apos;accueil)</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={c.is_exclusive} onChange={(e) => set("is_exclusive", e.target.checked)} className="accent-[#C6A15B]" /> Collection exclusive</label>
      </div>
      <div className="flex items-center gap-4 md:col-span-2">
        <button disabled={busy} className="btn btn-gold min-h-10">{busy ? "…" : initial ? "Enregistrer" : "Créer la collection"}</button>
        {msg && <p className="text-xs text-gold">{msg}</p>}
      </div>
    </form>
  );
}
