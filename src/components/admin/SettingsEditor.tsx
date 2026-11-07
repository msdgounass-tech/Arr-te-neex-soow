"use client";
import { useState } from "react";
import { saveSettings } from "@/app/admin/actions";
import type { HomeSettings, PaymentSettings, StoreSettings } from "@/lib/types";
import { Card } from "./ui";
import { ImageField } from "./ImageField";

const STORE_FIELDS: [keyof StoreSettings, string, string?][] = [
  ["phone", "Téléphone"],
  ["whatsapp", "WhatsApp (reçoit les commandes transmises)", "77 000 00 00"],
  ["email", "E-mail"],
  ["address", "Adresse"],
  ["city", "Ville"],
  ["opening_hours", "Horaires", "Lun – Sam, 10 h – 20 h"],
  ["instagram", "Instagram", "@gounassluxury"],
  ["tiktok", "TikTok"],
  ["facebook", "Facebook"],
];

export function SettingsEditor({ store, home, payments }: { store: StoreSettings; home: HomeSettings; payments: PaymentSettings }) {
  const [s, setS] = useState(store);
  const [h, setH] = useState(home);
  const [pay, setPay] = useState(payments);
  const [msg, setMsg] = useState<Record<string, string>>({});
  const save = async (key: "store" | "home" | "payments") => {
    const val = key === "store" ? s : key === "home" ? h : pay;
    const r = await saveSettings(key, val as unknown as Record<string, string>);
    setMsg((m) => ({ ...m, [key]: r.error || r.message || "" }));
  };
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <p className="label mb-5">Coordonnées de la boutique (affichées publiquement)</p>
        <div className="grid gap-4 md:grid-cols-2">
          {STORE_FIELDS.map(([k, label, ph]) => (
            <label key={k}><span className="label">{label}</span><input value={s[k]} placeholder={ph} onChange={(e) => setS((x) => ({ ...x, [k]: e.target.value }))} className="field-box mt-1" /></label>
          ))}
        </div>
        <div className="mt-6 flex items-center gap-4"><button onClick={() => save("store")} className="btn btn-primary min-h-10">Enregistrer</button><span className="text-xs text-accent">{msg.store}</span></div>
      </Card>
      <Card>
        <p className="label mb-5">Page d&apos;accueil</p>
        <label className="block"><span className="label">Bandeau d&apos;annonce (laisser vide pour masquer)</span><input value={h.announcement} onChange={(e) => setH((x) => ({ ...x, announcement: e.target.value }))} className="field-box mt-1" /></label>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <ImageField label="Logo (remplace le monogramme, format carré)" value={h.logo_url} onChange={(u) => setH((x) => ({ ...x, logo_url: u }))} bucket="site" folder="brand" />
        </div>
        <p className="mt-4 text-xs text-mist">Le visuel d&apos;accueil est un smartphone en 3D généré par le site : aucune image n&apos;est nécessaire. Sans logo personnalisé, le monogramme vectoriel est utilisé.</p>
        <div className="mt-6 flex items-center gap-4"><button onClick={() => save("home")} className="btn btn-primary min-h-10">Enregistrer</button><span className="text-xs text-accent">{msg.home}</span></div>
      </Card>
      <Card className="xl:col-span-2">
        <p className="label mb-2">Liens de paiement marchands</p>
        <p className="mb-5 text-xs leading-relaxed text-mist">
          Utilisés tant que l&apos;API officielle n&apos;est pas configurée. Le client paie via ce lien ; la commande n&apos;est marquée « Payée »
          qu&apos;après que l&apos;équipe a vérifié la réception dans l&apos;application marchande et saisi la référence de la transaction.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <label><span className="label">Lien Wave (pay.wave.com/…)</span><input value={pay.wave_link} onChange={(e) => setPay((x) => ({ ...x, wave_link: e.target.value }))} placeholder="https://pay.wave.com/m/…" className="field-box mt-1" /></label>
          <label><span className="label">Lien Orange Money</span><input value={pay.orange_money_link} onChange={(e) => setPay((x) => ({ ...x, orange_money_link: e.target.value }))} placeholder="https://…" className="field-box mt-1" /></label>
        </div>
        <div className="mt-6 flex items-center gap-4"><button onClick={() => save("payments")} className="btn btn-primary min-h-10">Enregistrer</button><span className="text-xs text-accent">{msg.payments}</span></div>
      </Card>
    </div>
  );
}
