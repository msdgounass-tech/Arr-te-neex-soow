"use client";
import { useState, useTransition } from "react";
import type { Address, Region } from "@/lib/types";
import { ActionForm } from "./forms";
import { saveAddressAction, deleteAddressAction } from "@/app/actions/account";
import { Sheet } from "@/components/ui/Sheet";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, Pill } from "@/components/ui/bits";
import { toast } from "@/components/ui/toast";

export function AddressManager({ addresses, regions }: { addresses: Address[]; regions: Region[] }) {
  const [editing, setEditing] = useState<Address | "new" | null>(null);
  const [, start] = useTransition();
  const a = editing && editing !== "new" ? editing : null;
  return (
    <>
      {addresses.length ? (
        <ul className="space-y-3">{addresses.map((ad) => (
          <li key={ad.id} className="card flex items-start justify-between gap-3 p-4">
            <div className="text-sm"><p className="flex items-center gap-2 font-semibold">{ad.label}{ad.is_default && <Pill tone="orange">Par défaut</Pill>}</p>
              <p className="mt-1 text-slate">{ad.recipient_name} · {ad.phone}<br />{ad.city}, {ad.region}{ad.details ? ` — ${ad.details}` : ""}</p></div>
            <div className="flex shrink-0 gap-1">
              <button type="button" className="press rounded-full p-2 hover:bg-mist" aria-label="Modifier" onClick={() => setEditing(ad)}><Icon name="edit" size={18} /></button>
              <button type="button" className="press rounded-full p-2 hover:bg-mist" aria-label="Supprimer" onClick={() => { if (confirm("Supprimer cette adresse ?")) start(async () => { const r = await deleteAddressAction(ad.id); toast(r.ok ? "Adresse supprimée" : r.error, r.ok ? "info" : "error"); }); }}><Icon name="trash" size={18} /></button>
            </div></li>))}</ul>
      ) : <EmptyState icon="map-pin" title="Aucune adresse enregistrée" text="Enregistrez une adresse pour commander plus vite." />}
      <button type="button" className="btn btn-primary press mt-4" onClick={() => setEditing("new")}><Icon name="plus" size={18} /> Ajouter une adresse</button>
      <Sheet open={editing !== null} onClose={() => setEditing(null)} title={a ? "Modifier l'adresse" : "Nouvelle adresse"}>
        <ActionForm key={a?.id ?? "new"} action={saveAddressAction} submitLabel="Enregistrer l'adresse" onDone={() => setEditing(null)}>
          {a && <input type="hidden" name="id" value={a.id} />}
          <div><label className="label" htmlFor="ad-label">Nom de l'adresse</label><input id="ad-label" name="label" className="field" defaultValue={a?.label ?? "Domicile"} /></div>
          <div><label className="label" htmlFor="ad-name">Destinataire</label><input id="ad-name" name="recipient_name" className="field" defaultValue={a?.recipient_name ?? ""} autoComplete="name" /></div>
          <div><label className="label" htmlFor="ad-phone">Téléphone</label><input id="ad-phone" name="phone" type="tel" className="field" defaultValue={a?.phone ?? ""} placeholder="77 123 45 67" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="ad-region">Région</label><select id="ad-region" name="region" className="field" defaultValue={a?.region ?? ""}><option value="">Choisir…</option>{regions.map((r) => <option key={r.id}>{r.name}</option>)}</select></div>
            <div><label className="label" htmlFor="ad-city">Ville</label><input id="ad-city" name="city" className="field" defaultValue={a?.city ?? ""} /></div>
          </div>
          <div><label className="label" htmlFor="ad-details">Précisions</label><textarea id="ad-details" name="details" rows={2} className="field" defaultValue={a?.details ?? ""} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_default" defaultChecked={a?.is_default ?? addresses.length === 0} className="h-4 w-4 accent-[var(--color-orange-strong)]" />Adresse par défaut</label>
        </ActionForm>
      </Sheet>
    </>
  );
}
