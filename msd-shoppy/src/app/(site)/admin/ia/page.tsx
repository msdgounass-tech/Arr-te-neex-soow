import { supabaseServer } from "@/lib/supabase/server";
import { aiConfigured } from "@/lib/ai/provider";
import { AdminButton } from "@/components/admin/AdminButton";
import { ActionForm } from "@/components/account/forms";
import { setAiModuleAction, setPlanFeatureAction } from "@/app/actions/admin";
import { PageTitle } from "@/components/ui/bits";
import { FEATURE_LABEL, LEVEL_LABEL, PLAN_ORDER, type Level } from "@/lib/plans";

export const metadata = { title: "Shoppy AI — administration" };
type Overview = { month_calls: number; month_errors: number; month_cost_usd: number; by_feature: { feature: string; calls: number; cost_usd: number }[]; top_shops: { shop: string; calls: number; cost_usd: number }[] };
const usd = (n: number) => `${Number(n).toFixed(2)} $`;

export default async function AdminAiPage() {
  const sb = await supabaseServer();
  const [{ data: ov }, { data: features }, { data: modules }] = await Promise.all([
    sb.rpc("admin_ai_overview"), sb.from("plan_features").select("*"), sb.from("ai_modules").select("*").order("feature")]);
  const o = ov as Overview | null;
  const keys = [...new Set((features ?? []).map((f) => f.feature as string))];
  return (
    <div className="space-y-6">
      <PageTitle title="Shoppy AI" subtitle="Coûts, quotas par formule et interrupteurs des modules." />
      <p className={`rounded-xl p-3 text-sm ${aiConfigured() ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>
        {aiConfigured() ? `Fournisseur d'IA connecté (modèle ${process.env.SHOPPY_AI_MODEL || "claude-opus-5-5"}).`
          : "Fournisseur d'IA non configuré : ajoutez ANTHROPIC_API_KEY dans les variables d'environnement Vercel. Les analyses calculées fonctionnent sans."}</p>
      {o && (
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <div className="card p-4"><span className="text-sm text-slate">Générations ce mois</span><b className="block font-display text-2xl">{o.month_calls}</b></div>
          <div className="card p-4"><span className="text-sm text-slate">Erreurs ce mois</span><b className="block font-display text-2xl">{o.month_errors}</b></div>
          <div className="card p-4"><span className="text-sm text-slate">Coût estimé ce mois</span><b className="block font-display text-2xl">{usd(o.month_cost_usd)}</b><span className="text-xs text-slate">Calculé à partir des jetons consommés</span></div>
        </section>
      )}
      {o && o.top_shops.length > 0 && (
        <section className="card p-5"><h2 className="font-semibold">Boutiques les plus consommatrices</h2>
          <ul className="mt-3 divide-y divide-line text-sm">{o.top_shops.map((s) => <li key={s.shop} className="flex justify-between py-2"><span>{s.shop}</span><span className="text-slate">{s.calls} appels · {usd(s.cost_usd)}</span></li>)}</ul></section>
      )}
      <section className="card p-5"><h2 className="font-semibold">Modules</h2>
        <ul className="mt-3 divide-y divide-line">{(modules ?? []).map((m) => (
          <li key={m.feature} className="flex items-center justify-between gap-3 py-2 text-sm"><span>{FEATURE_LABEL[m.feature] ?? m.feature}</span>
            <AdminButton tone={m.enabled ? "secondary" : "primary"} label={m.enabled ? "Désactiver" : "Réactiver"} action={setAiModuleAction.bind(null, m.feature, !m.enabled)}
              confirmText={m.enabled ? "Désactiver ce module pour toutes les boutiques ?" : undefined} /></li>))}</ul></section>
      <section className="card overflow-x-auto p-5"><h2 className="font-semibold">Droits et quotas mensuels par formule</h2>
        <p className="mt-1 text-sm text-slate">Le quota ne concerne que les fonctions qui appellent le fournisseur d'IA (titres, publicités, traduction, conversation). Laisser vide pour les analyses calculées.</p>
        <div className="mt-3 space-y-4">{keys.map((k) => (
          <div key={k}><b className="text-sm">{FEATURE_LABEL[k] ?? k}</b>
            <div className="mt-2 grid gap-2 md:grid-cols-3">{PLAN_ORDER.map((plan) => { const f = (features ?? []).find((x) => x.plan_code === plan && x.feature === k); return (
              <ActionForm key={plan} action={setPlanFeatureAction} submitLabel="Enregistrer" className="space-y-2 rounded-xl border border-line p-3">
                <input type="hidden" name="plan" value={plan} /><input type="hidden" name="feature" value={k} />
                <span className="block text-xs font-semibold capitalize">{plan}</span>
                <select name="level" defaultValue={f?.level ?? "none"} className="field">{(["none", "basic", "full", "advanced"] as Level[]).map((l) => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}</select>
                <input name="quota" type="number" min={0} max={100000} defaultValue={f?.monthly_quota ?? ""} placeholder="Quota / mois" className="field" />
              </ActionForm>); })}</div></div>))}</div>
      </section>
    </div>
  );
}
