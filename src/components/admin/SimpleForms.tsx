"use client";
import { useActionState, useState } from "react";
import { saveCategory, saveCoupon, saveSettings, saveZone, type ActionResult } from "@/app/admin/actions";

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

export function ZoneForm({ initial }: { initial?: { id: string; name: string; fee: number; free_above: number | null; delay: string | null; position: number; is_active: boolean; fee_mode: string; per_km_fee: number; max_km: number | null } }) {
  const [s, action, pending] = useActionState<ActionResult, FormData>(saveZone, {});
  const [mode, setMode] = useState(initial?.fee_mode || "quote");
  return (
    <form action={action} className="grid items-end gap-3 md:grid-cols-4 xl:grid-cols-8">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <label className="xl:col-span-2"><span className="label">Zone</span><input name="name" required defaultValue={initial?.name} className="field-box mt-1" /></label>
      <label className="xl:col-span-2"><span className="label">Tarification</span>
        <select name="fee_mode" value={mode} onChange={(e) => setMode(e.target.value)} className="field-box mt-1">
          <option value="quote">À confirmer après commande</option>
          <option value="fixed">Tarif fixe</option>
          <option value="distance">Selon la distance (GPS)</option>
        </select>
      </label>
      <label><span className="label">{mode === "distance" ? "Base (FCFA)" : "Tarif (FCFA)"}</span><input name="fee" type="number" min={0} required defaultValue={initial?.fee ?? 0} disabled={mode === "quote"} className="field-box mt-1 disabled:opacity-40" /></label>
      {mode === "distance" ? (
        <>
          <label><span className="label">Prix / km</span><input name="per_km_fee" type="number" min={0} defaultValue={initial?.per_km_fee ?? 0} className="field-box mt-1" /></label>
          <label><span className="label">Distance max (km)</span><input name="max_km" type="number" min={1} defaultValue={initial?.max_km ?? ""} className="field-box mt-1" /></label>
        </>
      ) : (
        <>
          <input type="hidden" name="per_km_fee" value={initial?.per_km_fee ?? 0} />
          <input type="hidden" name="max_km" value={initial?.max_km ?? ""} />
        </>
      )}
      <label><span className="label">Offerte dès (FCFA)</span><input name="free_above" type="number" min={0} defaultValue={initial?.free_above ?? ""} className="field-box mt-1" /></label>
      <label className="xl:col-span-2"><span className="label">Délai affiché</span><input name="delay" defaultValue={initial?.delay || ""} placeholder="24 à 48 h" className="field-box mt-1" /></label>
      <label><span className="label">Ordre</span><input name="position" type="number" defaultValue={initial?.position ?? 0} className="field-box mt-1" /></label>
      <label className="flex items-center gap-2 pb-2 text-xs"><input type="checkbox" name="is_active" defaultChecked={initial?.is_active ?? false} className="accent-[#C6A15B]" /> Active</label>
      <button disabled={pending} className="btn btn-ghost-gold min-h-10 px-4">{initial ? "Enregistrer" : "Ajouter"}</button>
      {mode === "quote" && <input type="hidden" name="fee" value={initial?.fee ?? 0} />}
      <div className="md:col-span-4 xl:col-span-8"><Feedback s={s} /></div>
    </form>
  );
}

export function DeliveryOriginForm({ initial }: { initial: { origin_lat: string; origin_lng: string; road_factor: string } }) {
  const [v, setV] = useState(initial);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="grid items-end gap-3 md:grid-cols-[1fr_1fr_140px_auto_auto]">
      <label><span className="label">Latitude du point de départ</span><input value={v.origin_lat} onChange={(e) => setV({ ...v, origin_lat: e.target.value })} placeholder="14.6928" className="field-box mt-1" /></label>
      <label><span className="label">Longitude</span><input value={v.origin_lng} onChange={(e) => setV({ ...v, origin_lng: e.target.value })} placeholder="-17.4467" className="field-box mt-1" /></label>
      <label><span className="label">Coef. routier</span><input value={v.road_factor} onChange={(e) => setV({ ...v, road_factor: e.target.value })} className="field-box mt-1" /></label>
      <button
        type="button"
        onClick={() =>
          navigator.geolocation?.getCurrentPosition(
            (p) => setV((x) => ({ ...x, origin_lat: p.coords.latitude.toFixed(6), origin_lng: p.coords.longitude.toFixed(6) })),
            () => setMsg("Position non obtenue."),
            { enableHighAccuracy: true },
          )
        }
        className="btn btn-outline min-h-10 px-4"
      >
        Ma position
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const r = await saveSettings("delivery", v);
          setMsg(r.error || r.message || "");
          setBusy(false);
        }}
        className="btn btn-gold min-h-10 px-4"
      >
        Enregistrer
      </button>
      {msg && <p className="text-xs text-gold md:col-span-5">{msg}</p>}
    </div>
  );
}
