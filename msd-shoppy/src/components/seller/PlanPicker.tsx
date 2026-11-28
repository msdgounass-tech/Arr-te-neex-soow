"use client";
import { useState } from "react";
import { ActionForm } from "@/components/account/forms";
import { Icon } from "@/components/ui/Icon";
import { formatPrice } from "@/lib/format";
import { PLANS, PLAN_ORDER, yearlySaving, type PlanCode } from "@/lib/plans";
import type { ActionResult } from "@/lib/errors";

export interface PlanRow { code: string; name: string; price_xof: number | null; price_year_xof: number | null }
type Cycle = "monthly" | "yearly";

const YEAR_GIFT: Record<PlanCode, string> = { starter: "1 mois offert", pro: "1 mois et 15 jours offerts", business: "2 mois offerts" };

/** Comparatif des formules + choix mensuel/annuel. Avec `action`, affiche aussi la déclaration de paiement. */
export function PlanPicker({ plans, current, action, canPay = true }:
  { plans: PlanRow[]; current?: string | null; action?: (s: ActionResult | null, f: FormData) => Promise<ActionResult>; canPay?: boolean }) {
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const rows = PLAN_ORDER.map((c) => plans.find((p) => p.code === c)).filter(Boolean) as PlanRow[];
  const [chosen, setChosen] = useState<string>(current && rows.some((r) => r.code === current) ? current : "pro");
  const sel = rows.find((r) => r.code === chosen);
  const amount = sel ? (cycle === "yearly" ? sel.price_year_xof : sel.price_xof) : null;

  return (
    <div className="space-y-5">
      <div role="radiogroup" aria-label="Période de paiement" className="inline-flex rounded-full bg-mist p-1 text-sm font-semibold">
        {(["monthly", "yearly"] as Cycle[]).map((c) => (
          <button key={c} type="button" role="radio" aria-checked={cycle === c} onClick={() => setCycle(c)}
            className={`press rounded-full px-4 py-2 transition-colors ${cycle === c ? "bg-white text-ink shadow-sm" : "text-slate"}`}>
            {c === "monthly" ? "Mensuel" : "Annuel"}{c === "yearly" && <span className="ml-1.5 text-orange-text">· jusqu'à 2 mois offerts</span>}
          </button>
        ))}
      </div>

      <ul className="grid gap-3 md:grid-cols-3">
        {rows.map((p) => {
          const info = PLANS[p.code as PlanCode];
          const monthly = p.price_xof ?? 0, yearly = p.price_year_xof ?? 0;
          const saving = yearlySaving(monthly, yearly);
          const active = chosen === p.code;
          return (
            <li key={p.code}>
              <button type="button" onClick={() => setChosen(p.code)} aria-pressed={active}
                className={`press relative flex h-full w-full flex-col rounded-3xl border-2 p-5 text-left transition-colors ${active ? "border-orange-strong bg-orange-soft/40" : "border-line bg-white hover:border-orange/40"}`}>
                {info?.highlight && <span className="absolute -top-3 left-5 rounded-full bg-orange-strong px-3 py-0.5 text-xs font-bold text-white">Le plus choisi</span>}
                <span className="flex items-center justify-between gap-2">
                  <b className="font-display text-lg">{p.name}</b>
                  {current === p.code && <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">Votre formule</span>}
                </span>
                <span className="mt-0.5 text-sm text-slate">{info?.tagline}</span>
                {cycle === "monthly" ? (
                  <span className="mt-4"><span className="font-display text-3xl font-bold">{formatPrice(monthly)}</span><span className="text-sm text-slate"> / mois</span></span>
                ) : (
                  <span className="mt-4 block">
                    <span className="font-display text-3xl font-bold">{formatPrice(yearly)}</span><span className="text-sm text-slate"> / an</span>
                    <span className="mt-1 block text-sm text-slate">soit {formatPrice(Math.round(yearly / 12))} par mois · 12 mois de service</span>
                    <span className="mt-1 inline-block rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">{YEAR_GIFT[p.code as PlanCode]} · {formatPrice(saving)} d'économie</span>
                  </span>
                )}
                {info?.includesPrevious && <span className="mt-4 text-sm font-semibold">Tout {PLANS[info.includesPrevious] && rows.find((r) => r.code === info.includesPrevious)?.name}, plus :</span>}
                <ul className={`${info?.includesPrevious ? "mt-2" : "mt-4"} space-y-2 text-sm`}>
                  {info?.features.map((f) => (
                    <li key={f.label} className={`flex gap-2 ${f.soon ? "text-slate" : ""}`}>
                      <Icon name={f.soon ? "clock" : "check"} size={16} className={`mt-0.5 shrink-0 ${f.soon ? "" : "text-success"}`} />
                      <span>{f.label}{f.soon && <span className="ml-1 rounded bg-mist px-1.5 text-xs">Bientôt</span>}</span>
                    </li>
                  ))}
                </ul>
              </button>
            </li>
          );
        })}
      </ul>

      {action && canPay && sel && (
        <section className="card p-5">
          <h3 className="font-semibold">Payer la formule {sel.name} {cycle === "yearly" ? "(annuelle)" : "(mensuelle)"}</h3>
          <p className="mt-1 text-sm text-slate">
            Montant : <b className="text-ink">{amount != null ? formatPrice(amount) : "—"}</b> pour {cycle === "yearly" ? "12 mois" : "30 jours"}.
            Payez par Wave ou Orange Money, puis indiquez la référence de la transaction. L'abonnement est activé après vérification du paiement ;
            la durée s'ajoute à la fin de votre période en cours.
          </p>
          <ActionForm action={action} submitLabel="Envoyer pour vérification" className="mt-4 space-y-4">
            <input type="hidden" name="plan" value={sel.code} />
            <input type="hidden" name="cycle" value={cycle} />
            <div><label className="label" htmlFor="method">Moyen de paiement</label>
              <select id="method" name="method" className="field"><option value="wave">Wave</option><option value="orange_money">Orange Money</option><option value="autre">Autre</option></select></div>
            <div><label className="label" htmlFor="reference">Référence de la transaction</label>
              <input id="reference" name="reference" className="field" maxLength={80} placeholder="Ex. T0ABC12345" /></div>
          </ActionForm>
        </section>
      )}
    </div>
  );
}
