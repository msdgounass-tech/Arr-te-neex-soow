"use client";
import { useActionState } from "react";
import { saveCategory, saveCoupon, saveZone, type ActionResult } from "@/app/admin/actions";

function Feedback({ s }: { s: ActionResult }) {
  return s.error ? <p className="text-xs text-danger">{s.error}</p> : s.message ? <p className="text-xs text-gold">{s.message}</p> : null;
}

export function CategoryForm({ parents, initial }: { parents: { id: string; name: string; gender: string | null }[]; initial?: { id: string; name: string; parent_id: string | null; gender: string | null; position: number; is_accessory: boolean; is_active: boolean } }) {
  const [s, action, pending] = useActionState<ActionResult, FormData>(saveCategory, {});
  return (
    <form action={action} className="grid items-end gap-3 md:grid-cols-[2fr_1.5fr_1fr_80px_auto_auto_auto]">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <label><span className="label">Nom</span><input name="name" required defaultValue={initial?.name} className="field-box mt-1" /></label>
      <label><span className="label">Parent</span>
        <select name="parent_id" defaultValue={initial?.parent_id || ""} className="field-box mt-1"><option value="">— Univers principal —</option>{parents.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      </label>
      <label><span className="label">Genre</span>
        <select name="gender" defaultValue={initial?.gender || ""} className="field-box mt-1"><option value="">—</option><option value="homme">Homme</option><option value="femme">Femme</option><option value="unisexe">Unisexe</option></select>
      </label>
      <label><span className="label">Ordre</span><input name="position" type="number" defaultValue={initial?.position ?? 0} className="field-box mt-1" /></label>
      <label className="flex items-center gap-2 pb-2 text-xs"><input type="checkbox" name="is_accessory" defaultChecked={initial?.is_accessory} className="accent-[#C6A15B]" /> Accessoire</label>
      <label className="flex items-center gap-2 pb-2 text-xs"><input type="checkbox" name="is_active" defaultChecked={initial?.is_active ?? true} className="accent-[#C6A15B]" /> Active</label>
      <button disabled={pending} className="btn btn-ghost-gold min-h-10 px-4">{initial ? "Enregistrer" : "Ajouter"}</button>
      <div className="md:col-span-7"><Feedback s={s} /></div>
    </form>
  );
}

const toLocal = (d: string | null | undefined) => (d ? new Date(d).toISOString().slice(0, 16) : "");

export function CouponForm({ initial }: { initial?: { id: string; code: string; description: string | null; discount_type: string; value: number; min_order: number; max_uses: number | null; starts_at: string | null; ends_at: string | null; is_active: boolean } }) {
  const [s, action, pending] = useActionState<ActionResult, FormData>(saveCoupon, {});
  return (
    <form action={action} className="grid items-end gap-3 md:grid-cols-4 xl:grid-cols-8">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <label><span className="label">Code</span><input name="code" required defaultValue={initial?.code} className="field-box mt-1 uppercase" /></label>
      <label><span className="label">Type</span><select name="discount_type" defaultValue={initial?.discount_type || "percent"} className="field-box mt-1"><option value="percent">Pourcentage</option><option value="fixed">Montant fixe</option></select></label>
      <label><span className="label">Valeur</span><input name="value" type="number" min={1} required defaultValue={initial?.value} className="field-box mt-1" /></label>
      <label><span className="label">Minimum (FCFA)</span><input name="min_order" type="number" min={0} defaultValue={initial?.min_order ?? 0} className="field-box mt-1" /></label>
      <label><span className="label">Utilisations max</span><input name="max_uses" type="number" min={1} defaultValue={initial?.max_uses ?? ""} className="field-box mt-1" /></label>
      <label><span className="label">Début</span><input name="starts_at" type="datetime-local" defaultValue={toLocal(initial?.starts_at)} className="field-box mt-1" /></label>
      <label><span className="label">Fin</span><input name="ends_at" type="datetime-local" defaultValue={toLocal(initial?.ends_at)} className="field-box mt-1" /></label>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 pb-2 text-xs"><input type="checkbox" name="is_active" defaultChecked={initial?.is_active ?? true} className="accent-[#C6A15B]" /> Actif</label>
        <button disabled={pending} className="btn btn-ghost-gold min-h-10 px-4">{initial ? "OK" : "Créer"}</button>
      </div>
      <label className="md:col-span-4 xl:col-span-8"><span className="label">Description interne</span><input name="description" defaultValue={initial?.description || ""} className="field-box mt-1" /></label>
      <div className="md:col-span-4 xl:col-span-8"><Feedback s={s} /></div>
    </form>
  );
}

export function ZoneForm({ initial }: { initial?: { id: string; name: string; fee: number; free_above: number | null; delay: string | null; position: number; is_active: boolean } }) {
  const [s, action, pending] = useActionState<ActionResult, FormData>(saveZone, {});
  return (
    <form action={action} className="grid items-end gap-3 md:grid-cols-[1.6fr_1fr_1fr_1.6fr_70px_auto_auto]">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <label><span className="label">Zone</span><input name="name" required defaultValue={initial?.name} className="field-box mt-1" /></label>
      <label><span className="label">Tarif (FCFA)</span><input name="fee" type="number" min={0} required defaultValue={initial?.fee ?? 0} className="field-box mt-1" /></label>
      <label><span className="label">Offerte dès</span><input name="free_above" type="number" min={0} defaultValue={initial?.free_above ?? ""} className="field-box mt-1" /></label>
      <label><span className="label">Délai affiché</span><input name="delay" defaultValue={initial?.delay || ""} placeholder="24 à 48 h" className="field-box mt-1" /></label>
      <label><span className="label">Ordre</span><input name="position" type="number" defaultValue={initial?.position ?? 0} className="field-box mt-1" /></label>
      <label className="flex items-center gap-2 pb-2 text-xs"><input type="checkbox" name="is_active" defaultChecked={initial?.is_active ?? false} className="accent-[#C6A15B]" /> Active</label>
      <button disabled={pending} className="btn btn-ghost-gold min-h-10 px-4">{initial ? "Enregistrer" : "Ajouter"}</button>
      <div className="md:col-span-7"><Feedback s={s} /></div>
    </form>
  );
}
