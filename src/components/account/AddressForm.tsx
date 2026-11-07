"use client";
import { useActionState, useEffect, useRef } from "react";
import { addAddress, type FormState } from "@/app/(store)/compte/actions";
import type { DeliveryZone } from "@/lib/types";

export function AddressForm({ zones }: { zones: DeliveryZone[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addAddress, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="grid gap-x-8 gap-y-6 md:grid-cols-2">
      <label><span className="label">Libellé</span><input name="label" placeholder="Maison, Bureau…" className="field" /></label>
      <label><span className="label">Nom complet *</span><input name="full_name" required className="field" /></label>
      <label><span className="label">Téléphone *</span><input name="phone" type="tel" required className="field" /></label>
      <label>
        <span className="label">Zone de livraison</span>
        <select name="zone_id" className="field" defaultValue="">
          <option value="">—</option>
          {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
        </select>
      </label>
      <label className="md:col-span-2"><span className="label">Adresse *</span><input name="address_line" required className="field" /></label>
      <label><span className="label">Ville *</span><input name="city" required className="field" /></label>
      <label><span className="label">Région</span><input name="region" className="field" /></label>
      <label className="md:col-span-2"><span className="label">Indications</span><input name="notes" className="field" /></label>
      <div className="md:col-span-2">
        {state.error && <p className="mb-4 text-sm text-danger">{state.error}</p>}
        {state.message && <p className="mb-4 text-sm text-accent">{state.message}</p>}
        <button disabled={pending} className="btn btn-ghost">{pending ? "…" : "Ajouter l'adresse"}</button>
      </div>
    </form>
  );
}
