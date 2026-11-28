import Link from "next/link";
import { getAiAccess } from "@/lib/ai/access";
import { stockAlerts, stockCover, type SalesInsights } from "@/lib/insights";
import { DataNote, Locked } from "@/components/ai/Locked";

export const metadata = { title: "Mon stock" };
const LABEL = { rupture: ["Rupture", "bg-danger-soft text-danger"], faible: ["Stock faible", "bg-warning-soft text-warning"],
  dormant: ["Produit dormant", "bg-mist text-slate"], incoherent: ["Incohérence", "bg-warning-soft text-warning"] } as const;

export default async function StockPage() {
  const { sb, level, matrix, plan } = await getAiAccess();
  const lv = level("stock");
  if (lv === "none") return <Locked feature="stock" matrix={matrix} expired={!plan} />;
  const { data } = await sb.rpc("ai_sales_insights", { p_days: 60 });
  const s = data as SalesInsights;
  const alerts = stockAlerts(s).filter((a) => lv === "advanced" || a.level !== "dormant");
  const tracked = s.products.filter((p) => p.status === "published" && p.stock != null);
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Gestion intelligente du stock</h2>
      <DataNote>Les prévisions sont des estimations fondées sur le rythme de vente des 60 derniers jours. Elles deviennent fiables avec un historique de ventes régulier. Le stock n'est jamais modifié sans votre action.</DataNote>
      <section className="card p-5"><h3 className="font-semibold">Alertes</h3>
        {alerts.length ? <ul className="mt-3 space-y-3">{alerts.map((a) => (
          <li key={a.productId + a.level} className="flex flex-wrap items-start gap-2 rounded-xl border border-line p-3">
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${LABEL[a.level][1]}`}>{LABEL[a.level][0]}</span>
            <span className="min-w-0 flex-1 text-sm"><b>{a.title}</b> — {a.text}</span>
            <Link href={`/vendeur/produits/${a.productId}`} className="link text-sm">Mettre à jour</Link></li>))}</ul>
          : <p className="mt-2 text-sm text-slate">Aucune alerte de stock pour le moment.</p>}
        {lv !== "advanced" && <p className="mt-3 text-xs text-slate">Détection des produits dormants et suggestions pour les écouler : formule Business.</p>}
      </section>
      <section className="card overflow-x-auto p-5"><h3 className="font-semibold">Rythme de vente et couverture</h3>
        {tracked.length ? <table className="mt-3 w-full min-w-[480px] text-left text-sm">
          <thead className="text-xs text-slate"><tr><th className="py-2">Produit</th><th>Stock</th><th>Vendus (60 j)</th><th>Par jour</th><th>Jours restants (estim.)</th></tr></thead>
          <tbody className="divide-y divide-line">{tracked.map((p) => { const c = stockCover(p.units, s.days, p.stock); return (
            <tr key={p.id}><td className="max-w-[220px] truncate py-2">{p.title}</td><td>{p.stock}</td><td>{p.units}</td><td>{c.perDay}</td>
              <td className={c.coverDays != null && c.coverDays <= 7 ? "font-semibold text-warning" : ""}>{c.coverDays ?? "—"}</td></tr>); })}</tbody></table>
          : <p className="mt-2 text-sm text-slate">Aucun produit avec un stock suivi. Indiquez une quantité sur vos fiches produits pour activer les prévisions.</p>}
      </section>
    </div>
  );
}
