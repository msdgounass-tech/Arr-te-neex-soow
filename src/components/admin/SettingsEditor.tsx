"use client";
import { useState } from "react";
import { saveSettings } from "@/app/admin/actions";
import type { HomeSettings, StoreSettings } from "@/lib/types";
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

export function SettingsEditor({ store, home }: { store: StoreSettings; home: HomeSettings }) {
  const [s, setS] = useState(store);
  const [h, setH] = useState(home);
  const [msg, setMsg] = useState<Record<string, string>>({});
  const save = async (key: "store" | "home") => {
    const r = await saveSettings(key, key === "store" ? (s as unknown as Record<string, string>) : (h as unknown as Record<string, string>));
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
        <div className="mt-6 flex items-center gap-4"><button onClick={() => save("store")} className="btn btn-gold min-h-10">Enregistrer</button><span className="text-xs text-gold">{msg.store}</span></div>
      </Card>
      <Card>
        <p className="label mb-5">Page d&apos;accueil</p>
        <label className="block"><span className="label">Bandeau d&apos;annonce (laisser vide pour masquer)</span><input value={h.announcement} onChange={(e) => setH((x) => ({ ...x, announcement: e.target.value }))} className="field-box mt-1" /></label>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <ImageField label="Bannière principale (mannequins)" value={h.hero_image} onChange={(u) => setH((x) => ({ ...x, hero_image: u }))} bucket="site" folder="home" />
          <ImageField label="Collection Homme" value={h.men_image} onChange={(u) => setH((x) => ({ ...x, men_image: u }))} bucket="site" folder="home" />
          <ImageField label="Collection Femme" value={h.women_image} onChange={(u) => setH((x) => ({ ...x, women_image: u }))} bucket="site" folder="home" />
          <ImageField label="Accessoires" value={h.accessories_image} onChange={(u) => setH((x) => ({ ...x, accessories_image: u }))} bucket="site" folder="home" />
          <ImageField label="Bannière éditoriale" value={h.editorial_image} onChange={(u) => setH((x) => ({ ...x, editorial_image: u }))} bucket="site" folder="home" />
        </div>
        <p className="mt-4 text-xs text-mist">Sans image personnalisée, les visuels éditoriaux par défaut sont utilisés.</p>
        <div className="mt-6 flex items-center gap-4"><button onClick={() => save("home")} className="btn btn-gold min-h-10">Enregistrer</button><span className="text-xs text-gold">{msg.home}</span></div>
      </Card>
    </div>
  );
}
