"use client";
import { useState } from "react";
import { formatPrice } from "@/lib/format";
import { margin, minPriceForMargin } from "@/lib/insights";

/** Simulation de prix : rien n'est appliqué à la fiche produit, le vendeur décide. */
export function PriceSimulator({ price, cost, extra }: { price: number; cost: number | null; extra: number | null }) {
  const [p, setP] = useState(price);
  const [target, setTarget] = useState(30);
  const [promo, setPromo] = useState(0);
  if (cost == null) return <p className="text-sm text-slate">Renseignez le coût d'achat pour simuler vos marges.</p>;
  const total = cost + (extra ?? 0);
  const sale = Math.round(p * (1 - promo / 100));
  const m = margin(sale, cost, extra)!;
  const min = minPriceForMargin(total, target);
  return (
    <div className="grid gap-3 text-sm sm:grid-cols-3">
      <label className="block"><span className="label">Prix testé (F)</span><input type="number" min={1} className="field" value={p} onChange={(e) => setP(Math.max(0, Number(e.target.value)))} /></label>
      <label className="block"><span className="label">Réduction testée (%)</span><input type="number" min={0} max={90} className="field" value={promo} onChange={(e) => setPromo(Math.min(90, Math.max(0, Number(e.target.value))))} /></label>
      <label className="block"><span className="label">Marge souhaitée (%)</span><input type="number" min={0} max={95} className="field" value={target} onChange={(e) => setTarget(Math.min(95, Math.max(0, Number(e.target.value))))} /></label>
      <p className="sm:col-span-3">Prix payé par le client : <b>{formatPrice(sale)}</b> · bénéfice estimé : <b className={m.value < 0 ? "text-danger" : ""}>{formatPrice(m.value)}</b> ({m.rate} %).
        {min != null && <> Prix minimum pour {target} % de marge : <b>{formatPrice(min)}</b>.</>}
        {m.value < 0 && <span className="text-danger"> Attention : à ce prix, vous vendez à perte.</span>}</p>
    </div>
  );
}
