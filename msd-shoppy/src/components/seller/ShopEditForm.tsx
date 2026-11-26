"use client";
import { useActionState, useEffect } from "react";
import type { Category, Domain, Region, Shop } from "@/lib/types";
import { updateShopAction } from "@/app/actions/seller";
import { ShopFields, ImagePicker } from "./ShopFields";
import { toast } from "@/components/ui/toast";

export function ShopEditForm({ shop, domains, categories, regions, specialties, canManage }:
  { shop: Shop; domains: Domain[]; categories: Category[]; regions: Region[]; specialties: number[]; canManage: boolean }) {
  const [state, action, pending] = useActionState(updateShopAction, null);
  useEffect(() => { if (state?.ok && state.message) toast(state.message); }, [state]);
  const errors = state && !state.ok ? state.fields ?? {} : {};
  return (
    <form action={action} noValidate className="space-y-5">
      <fieldset disabled={!canManage} className="space-y-5">
        <section className="card space-y-4 p-5"><h2 className="font-semibold">Identité</h2>
          <ShopFields domains={domains} categories={categories} regions={regions} shop={shop} specialties={specialties} errors={errors} step="identity" />
          <ImagePicker name="cover" label="Photo de couverture" current={shop.cover_url} hint="Format paysage, 1600 × 600 pixels conseillés." square={false} /></section>
        <section className="card space-y-4 p-5"><h2 className="font-semibold">Activité et localisation</h2>
          <ShopFields domains={domains} categories={categories} regions={regions} shop={shop} specialties={specialties} errors={errors} step="activity" />
          <div><label className="label" htmlFor="address_public">Adresse affichée (facultatif)</label><input id="address_public" name="address_public" className="field" defaultValue={shop.address_public ?? ""} placeholder="Ex. Marché Sandaga, cantine 12" /></div></section>
        <section className="card space-y-4 p-5"><h2 className="font-semibold">Coordonnées publiques</h2>
          <ShopFields domains={domains} categories={categories} regions={regions} shop={shop} specialties={specialties} errors={errors} step="contact" /></section>
        <section className="card space-y-4 p-5"><h2 className="font-semibold">Politique de retour</h2>
          <textarea name="return_policy" rows={3} maxLength={1000} className="field" defaultValue={shop.return_policy ?? ""} aria-label="Politique de retour" placeholder="Ex. Échange possible sous 3 jours si le produit n'a pas été porté." /></section>
        <label className="card flex items-start justify-between gap-4 p-5">
          <span><b className="block">Boutique visible</b><span className="text-sm text-slate">Décochez pour fermer temporairement votre boutique (congés, inventaire). Rien n'est supprimé.</span></span>
          <input type="checkbox" name="is_published" defaultChecked={shop.is_published} className="mt-1 h-5 w-5 accent-[var(--color-orange-strong)]" /></label>
      </fieldset>
      {state && !state.ok && <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}
      <button type="submit" disabled={pending || !canManage} className="btn btn-primary press">{pending ? "Enregistrement…" : "Enregistrer les modifications"}</button>
    </form>
  );
}
