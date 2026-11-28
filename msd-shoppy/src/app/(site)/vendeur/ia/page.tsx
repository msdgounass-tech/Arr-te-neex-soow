import Link from "next/link";
import { getAiAccess } from "@/lib/ai/access";
import { delta, salesFindings, stockAlerts, type SalesInsights } from "@/lib/insights";
import { formatNumber, formatPrice } from "@/lib/format";
import { FEATURE_LABEL, LEVEL_LABEL } from "@/lib/plans";
import { AI_LINKS } from "@/lib/ai/links";
import { DataNote } from "@/components/ai/Locked";
import { Icon } from "@/components/ui/Icon";

export const metadata = { title: "Vue d'ensemble" };

const MODULE_FEATURE: Record<string, string> = {
  "/vendeur/ia/plan": "action_plan", "/vendeur/ia/conseiller": "ai_chat", "/vendeur/ia/marche": "market", "/vendeur/ia/concurrents": "competitors",
  "/vendeur/ia/ventes": "sales", "/vendeur/ia/prix": "pricing", "/vendeur/ia/creer": "ai_content", "/vendeur/ia/publicite": "ai_ads",
  "/vendeur/ia/stock": "stock", "/vendeur/ia/fidelisation": "ai_chat",
};

function Delta({ cur, prev }: { cur: number; prev: number }) {
  const d = delta(cur, prev);
  if (d == null) return <span className="text-xs text-slate">pas de comparaison possible</span>;
  return <span className={`text-xs font-semibold ${d >= 0 ? "text-success" : "text-danger"}`}>{d >= 0 ? "+" : ""}{d} % vs 30 jours précédents</span>;
}

export default async function AiOverview() {
  const { sb, plan, access, level, aiReady, mine } = await getAiAccess();
  const [{ data: ins }, { data: actions }, { count: pending }] = await Promise.all([
    sb.rpc("ai_sales_insights", { p_days: 30 }),
    sb.from("ai_actions").select("id, title, body, link, priority").eq("status", "proposed").order("priority").order("created_at", { ascending: false }).limit(3),
    sb.from("orders").select("id", { count: "exact", head: true }).eq("shop_id", mine.shop.id).eq("status", "pending"),
  ]);
  const s = ins as SalesInsights | null;
  const findings = s ? salesFindings(s).slice(0, 3) : [];
  const alerts = s && level("stock") !== "none" ? stockAlerts(s).filter((a) => a.level !== "dormant").slice(0, 3) : [];
  const quotas = ["ai_content", "ai_ads", "ai_translate", "ai_chat"].map((f) => ({ f, ...access[f] })).filter((q) => q.level && q.level !== "none");

  return (
    <div className="space-y-6">
      {!plan && <DataNote>Votre abonnement n'est pas actif : Shoppy AI est en pause. Vos données sont conservées. <Link href="/vendeur/abonnement" className="link">Réactiver</Link></DataNote>}
      {!aiReady && <DataNote>La génération de textes par IA n'est pas encore activée sur la plateforme. Les analyses ci-dessous sont calculées sur vos données réelles et fonctionnent déjà.</DataNote>}

      {s && (
        <section aria-labelledby="resume">
          <h2 id="resume" className="mb-3 font-semibold">Résumé des 30 derniers jours</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="card p-4"><span className="text-sm text-slate">Consultations de produits</span><b className="block font-display text-2xl">{formatNumber(s.totals.views)}</b><Delta cur={s.totals.views} prev={s.totals.views_prev} /></div>
            <div className="card p-4"><span className="text-sm text-slate">Commandes reçues</span><b className="block font-display text-2xl">{formatNumber(s.totals.orders)}</b><Delta cur={s.totals.orders} prev={s.totals.orders_prev} /></div>
            <div className="card p-4"><span className="text-sm text-slate">Chiffre d'affaires (terminé)</span><b className="block font-display text-2xl">{formatPrice(s.totals.revenue)}</b><Delta cur={s.totals.revenue} prev={s.totals.revenue_prev} /></div>
          </div>
        </section>
      )}

      {((pending ?? 0) > 0 || alerts.length > 0 || findings.length > 0) && (
        <section aria-labelledby="alertes" className="card p-5">
          <h2 id="alertes" className="font-semibold">Alertes et opportunités</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {(pending ?? 0) > 0 && <li className="flex gap-3"><Icon name="clock" size={18} className="mt-0.5 shrink-0 text-warning" /><span><b>{pending} commande(s) en attente de réponse.</b> <Link href="/vendeur/commandes" className="link">Répondre</Link></span></li>}
            {alerts.map((a) => <li key={a.productId + a.level} className="flex gap-3"><Icon name="package" size={18} className="mt-0.5 shrink-0 text-danger" /><span><b>{a.title}</b> — {a.text}</span></li>)}
            {findings.map((f) => <li key={f.kind + f.productId} className="flex gap-3"><Icon name={f.tone === "success" ? "chart" : "info"} size={18} className={`mt-0.5 shrink-0 ${f.tone === "success" ? "text-success" : "text-warning"}`} /><span><b>{f.title}</b> — {f.text}</span></li>)}
          </ul>
        </section>
      )}

      <section aria-labelledby="actions" className="card p-5">
        <div className="flex items-center justify-between gap-3"><h2 id="actions" className="font-semibold">Actions recommandées cette semaine</h2>
          <Link href="/vendeur/ia/plan" className="link text-sm">Mon plan d'action</Link></div>
        {level("action_plan") === "none" ? <p className="mt-2 text-sm text-slate">Le plan d'action hebdomadaire est inclus à partir de la formule Pro.</p>
          : actions?.length ? (
            <ul className="mt-3 space-y-2">{actions.map((a) => (
              <li key={a.id}><Link href={a.link ?? "/vendeur/ia/plan"} className="press flex items-start gap-3 rounded-xl p-2 hover:bg-mist">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${a.priority === 1 ? "bg-danger" : a.priority === 2 ? "bg-warning" : "bg-success"}`} />
                <span><b className="block text-sm">{a.title}</b><span className="text-sm text-slate">{a.body}</span></span></Link></li>))}</ul>
          ) : <p className="mt-2 text-sm text-slate">Aucune recommandation en cours. <Link href="/vendeur/ia/plan" className="link">Générer mon plan de la semaine</Link></p>}
      </section>

      {quotas.length > 0 && (
        <section aria-labelledby="quotas" className="card p-5">
          <h2 id="quotas" className="font-semibold">Utilisation de l'IA ce mois-ci</h2>
          <ul className="mt-3 space-y-3">{quotas.map((q) => {
            const pct = q.quota ? Math.min(100, Math.round((q.used / q.quota) * 100)) : 0;
            return (<li key={q.f}><div className="flex justify-between text-sm"><span>{FEATURE_LABEL[q.f]}</span><span className={pct >= 80 ? "font-semibold text-warning" : "text-slate"}>{q.used} / {q.quota}</span></div>
              <div className="mt-1 h-2 rounded-full bg-mist"><div className={`h-2 rounded-full ${pct >= 80 ? "bg-warning" : "bg-orange"}`} style={{ width: `${pct}%` }} /></div>
              {pct >= 80 && <p className="mt-1 text-xs text-warning">{pct >= 100 ? "Quota atteint : il se renouvelle le 1er du mois." : "Bientôt épuisé : il se renouvelle le 1er du mois."}</p>}</li>);
          })}</ul>
        </section>
      )}

      <section aria-labelledby="modules">
        <h2 id="modules" className="mb-3 font-semibold">Modules</h2>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AI_LINKS.slice(1).map(([href, label]) => {
            const f = MODULE_FEATURE[href]; const lv = level(f);
            return (<li key={href}><Link href={href} className="card press flex h-full items-center justify-between gap-3 p-4 hover:border-[#cfd3db]">
              <span><b className="block">{label}</b><span className="text-xs text-slate">{lv === "none" ? "Non inclus dans votre formule" : LEVEL_LABEL[lv]}</span></span>
              <Icon name={lv === "none" ? "lock" : "chevron-right"} size={18} className="text-slate" /></Link></li>);
          })}
        </ul>
      </section>
    </div>
  );
}
