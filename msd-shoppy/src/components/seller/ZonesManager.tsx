"use client";
import { useState, useTransition } from "react";
import type { DeliveryZone, Region } from "@/lib/types";
import { saveZoneAction, deleteZoneAction } from "@/app/actions/seller";
import { ActionForm } from "@/components/account/forms";
import { Sheet } from "@/components/ui/Sheet";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/bits";
import { toast } from "@/components/ui/toast";
import { formatPrice } from "@/lib/format";

const METHODS = { delivery: "Livraison à domicile", pickup: "Retrait en boutique", shipping: "Expédition (transporteur, car)" } as const;

export function ZonesManager({ zones, regions, canManage }: { zones: DeliveryZone[]; regions: Region[]; canManage: boolean }) {
  const [edit, setEdit] = useState<DeliveryZone | "new" | null>(null);
  const [, start] = useTransition();
  const z = edit && edit !== "new" ? edit : null;
  return (
    <>
      {zones.length ? (
        <ul className="space-y-3">{zones.map((zone) => (
          <li key={zone.id} className="card flex items-start justify-between gap-3 p-4">
            <div className="text-sm"><p className="font-semibold">{zone.name}</p>
              <p className="text-slate">{METHODS[zone.method]} · {zone.fee == null ? "frais à convenir" : zone.fee === 0 ? "gratuit" : formatPrice(zone.fee)} · {zone.min_days}–{zone.max_days} jours</p>
              <p className="text-slate">{zone.regions.length ? zone.regions.join(", ") : "Toutes les régions"}</p></div>
            {canManage && <div className="flex gap-1">
              <button type="button" aria-label="Modifier" className="press rounded-full p-2 hover:bg-mist" onClick={() => setEdit(zone)}><Icon name="edit" size={18} /></button>
              <button type="button" aria-label="Supprimer" className="press rounded-full p-2 hover:bg-mist" onClick={() => { if (confirm("Retirer cette option de livraison ?")) start(async () => { const r = await deleteZoneAction(zone.id); toast(r.ok ? "Option retirée" : r.error, r.ok ? "info" : "error"); }); }}><Icon name="trash" size={18} /></button></div>}
          </li>))}</ul>
      ) : <EmptyState icon="truck" title="Aucune option de livraison" text="Sans option, le client est informé que les frais sont à convenir avec vous. Ajoutez vos zones, tarifs et délais pour rassurer vos acheteurs." />}
      {canManage && <button type="button" className="btn btn-primary press mt-4" onClick={() => setEdit("new")}><Icon name="plus" size={18} /> Ajouter une option</button>}
      <Sheet open={edit !== null} onClose={() => setEdit(null)} title={z ? "Modifier l'option" : "Nouvelle option de livraison"}>
        <ActionForm key={z?.id ?? "new"} action={saveZoneAction} submitLabel="Enregistrer" onDone={() => setEdit(null)}>
          {z && <input type="hidden" name="id" value={z.id} />}
          <div><label className="label" htmlFor="z-name">Nom</label><input id="z-name" name="name" className="field" defaultValue={z?.name ?? ""} placeholder="Ex. Dakar et banlieue" /></div>
          <div><label className="label" htmlFor="z-method">Mode</label><select id="z-method" name="method" className="field" defaultValue={z?.method ?? "delivery"}>
            {Object.entries(METHODS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <fieldset><legend className="label">Régions couvertes</legend><p className="hint mb-2 mt-0">Aucune case cochée = toutes les régions.</p>
            <div className="flex flex-wrap gap-2">{regions.map((r) => (
              <label key={r.id} className="chip press cursor-pointer has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-white">
                <input type="checkbox" name="regions" value={r.name} defaultChecked={z?.regions.includes(r.name)} className="sr-only" />{r.name}</label>))}</div></fieldset>
          <div><label className="label" htmlFor="z-fee">Frais (FCFA)</label><input id="z-fee" name="fee" inputMode="numeric" className="field" defaultValue={z?.fee ?? ""} placeholder="Vide = à convenir · 0 = gratuit" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="z-min">Délai minimum (jours)</label><input id="z-min" name="min_days" inputMode="numeric" className="field" defaultValue={z?.min_days ?? 1} /></div>
            <div><label className="label" htmlFor="z-max">Délai maximum (jours)</label><input id="z-max" name="max_days" inputMode="numeric" className="field" defaultValue={z?.max_days ?? 3} /></div>
          </div>
        </ActionForm>
      </Sheet>
    </>
  );
}
