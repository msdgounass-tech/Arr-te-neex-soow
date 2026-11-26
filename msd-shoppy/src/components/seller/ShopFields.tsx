"use client";
import { useState } from "react";
import Image from "next/image";
import type { Category, Domain, Region, Shop } from "@/lib/types";
import { compressImage } from "@/lib/compress";
import { Icon } from "@/components/ui/Icon";

export function Err({ msg, id }: { msg?: string; id: string }) { return msg ? <p id={id} className="error-text">{msg}</p> : null; }

export function ImagePicker({ name, label, current, hint, square = true }: { name: string; label: string; current?: string | null; hint: string; square?: boolean }) {
  const [preview, setPreview] = useState<string | null>(current ?? null);
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <span className="label">{label}</span>
      <label className={`press relative flex cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-line bg-mist text-slate hover:border-[#cfd3db] ${square ? "h-28 w-28" : "h-28 w-full"}`}>
        {preview ? <Image src={preview} alt="" fill sizes="300px" className="object-cover" unoptimized /> : <span className="flex flex-col items-center gap-1 text-xs"><Icon name="upload" />Ajouter</span>}
        <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
          const f = e.target.files?.[0]; if (!f) return; setError(null);
          try {
            const out = await compressImage(f, square ? 800 : 1600);
            const dt = new DataTransfer(); dt.items.add(out.file); e.target.files = dt.files;
            setPreview(URL.createObjectURL(out.file));
          } catch (err) { setError((err as Error).message); e.target.value = ""; }
        }} name={name} />
      </label>
      <p className="hint">{hint}</p>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

/** Champs communs à la création et à la modification d'une boutique. */
export function ShopFields({ domains, categories, regions, shop, specialties = [], errors = {}, step = "all" }:
  { domains: Domain[]; categories: Category[]; regions: Region[]; shop?: Shop | null; specialties?: number[]; errors?: Record<string, string>; step?: "identity" | "activity" | "contact" | "all" }) {
  const [domainId, setDomainId] = useState<string>(shop ? String(shop.domain_id) : "");
  const [specs, setSpecs] = useState<number[]>(specialties);
  const show = (s: string) => step === "all" || step === s;
  const inv = (k: string) => ({ "aria-invalid": errors[k] ? true : undefined, "aria-describedby": errors[k] ? `${k}-e` : undefined });
  const cats = categories.filter((c) => String(c.domain_id) === domainId);
  return (
    <>
      <div className={show("identity") ? "space-y-4" : "hidden"}>
        <div><label className="label" htmlFor="name">Nom de la boutique</label><input id="name" name="name" className="field" maxLength={60} defaultValue={shop?.name} {...inv("name")} /><Err id="name-e" msg={errors.name} /></div>
        <ImagePicker name="logo" label="Logo" current={shop?.logo_url} hint="Carré, 400 × 400 pixels minimum. Facultatif, mais recommandé." />
        <div><label className="label" htmlFor="description">Description</label>
          <textarea id="description" name="description" rows={4} maxLength={2000} className="field" defaultValue={shop?.description} placeholder="Ce que vous vendez, depuis quand, comment vous livrez." />
          <p className="hint">80 caractères ou plus recommandés.</p></div>
      </div>
      <div className={show("activity") ? "space-y-4" : "hidden"}>
        <div><label className="label" htmlFor="domain_id">Domaine principal</label>
          <select id="domain_id" name="domain_id" className="field" value={domainId} onChange={(e) => { setDomainId(e.target.value); setSpecs([]); }} {...inv("domain_id")}>
            <option value="">Choisir…</option>{domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select><Err id="domain_id-e" msg={errors.domain_id} /></div>
        {cats.length > 0 && (
          <fieldset><legend className="label">Spécialités</legend>
            <div className="flex flex-wrap gap-2">{cats.map((c) => {
              const on = specs.includes(c.id);
              return (<label key={c.id} className="chip press cursor-pointer has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-white">
                <input type="checkbox" name="specialties" value={c.id} checked={on} className="sr-only" onChange={() => setSpecs(on ? specs.filter((x) => x !== c.id) : [...specs, c.id])} />{c.name}</label>);
            })}</div><p className="hint">Choisissez 2 à 5 spécialités qui correspondent à votre catalogue.</p></fieldset>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label" htmlFor="region">Région</label><select id="region" name="region" className="field" defaultValue={shop?.region ?? ""} {...inv("region")}><option value="">Choisir…</option>{regions.map((r) => <option key={r.id}>{r.name}</option>)}</select><Err id="region-e" msg={errors.region} /></div>
          <div><label className="label" htmlFor="city">Ville ou quartier</label><input id="city" name="city" className="field" defaultValue={shop?.city} {...inv("city")} /><Err id="city-e" msg={errors.city} /></div>
        </div>
      </div>
      <div className={show("contact") ? "space-y-4" : "hidden"}>
        <p className="rounded-2xl bg-orange-soft p-3 text-sm text-orange-text">Ces coordonnées seront visibles par les acheteurs. Votre numéro personnel n'est jamais affiché automatiquement.</p>
        <div><label className="label" htmlFor="public_whatsapp">Numéro WhatsApp public</label><input id="public_whatsapp" name="public_whatsapp" type="tel" className="field" placeholder="77 123 45 67" defaultValue={shop?.public_whatsapp ?? ""} {...inv("public_whatsapp")} /><Err id="public_whatsapp-e" msg={errors.public_whatsapp} /></div>
        <div><label className="label" htmlFor="public_phone">Numéro d'appel public</label><input id="public_phone" name="public_phone" type="tel" className="field" placeholder="33 800 00 00" defaultValue={shop?.public_phone ?? ""} {...inv("public_phone")} /><Err id="public_phone-e" msg={errors.public_phone} /></div>
        <div><label className="label" htmlFor="public_email">E-mail professionnel (facultatif)</label><input id="public_email" name="public_email" type="email" className="field" defaultValue={shop?.public_email ?? ""} {...inv("public_email")} /><Err id="public_email-e" msg={errors.public_email} /></div>
      </div>
    </>
  );
}
