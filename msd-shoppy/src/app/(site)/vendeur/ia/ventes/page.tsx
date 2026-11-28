import Link from "next/link";
import { getAiAccess } from "@/lib/ai/access";
import { confidence, conversion, delta, salesFindings, WEEKDAYS, type SalesInsights } from "@/lib/insights";
import { formatNumber, formatPrice } from "@/lib/format";
import { ConfidenceTag, DataNote, Locked } from "@/components/ai/Locked";

export const metadata = { title: "Mes ventes" };

export default async function SalesPage({ searchParams }: { searchParams: Promise<{ jours?: string }> }) {
  const { jours } = await searchParams;
  const { sb, level, matrix, plan } = await getAiAccess();
  const lv = level("sales");
  if (lv === "none") return <Locked feature="sales" matrix={matrix} expired={!plan} />;
  const allowed = lv === "basic" ? [30] : [7, 30, 90];
  const days = allowed.includes(Number(jours)) ? Number(jours) : 30;
  const { data } = await sb.rpc("ai_sales_insights", { p_days: days });
  const s = data as SalesInsights;
  const findings = salesFindings(s);
  const pub = s.products.filter((p) => p.status === "published");
  const best = [...pub].sort((a, b) => b.units - a.units || b.revenue - a.revenue).filter((p) => p.units > 0).slice(0, 5);
  const weak = [...pub].filter((p) => p.units === 0).sort((a, b) => a.views - b.views).slice(0, 5);
  const topDay = [...s.weekdays].sort((a, b) => b.orders - a.orders)[0];
  const conv = conversion(s.totals.views, s.totals.orders);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-xl font-bold">Analyse des ventes</h2>
        {allowed.length > 1 && <nav aria-label="Période" className="flex rounded-full bg-mist p-1">{allowed.map((d) => (
          <Link key={d} href={`/vendeur/ia/ventes?jours=${d}`} aria-current={d === days ? "page" : undefined}
            className={`press rounded-full px-4 py-1.5 text-sm font-semibold ${d === days ? "bg-white shadow-sm" : "text-slate"}`}>{d} jours</Link>))}</nav>}
      </div>
      <DataNote>Calculé uniquement sur les consultations et commandes enregistrées par Shoppy by MSD sur {days} jours (vos propres visites sont exclues). Les commandes refusées ou annulées ne sont pas comptées.</DataNote>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="card p-4"><span className="text-sm text-slate">Consultations</span><b className="block font-display text-2xl">{formatNumber(s.totals.views)}</b></div>
        <div className="card p-4"><span className="text-sm text-slate">Commandes</span><b className="block font-display text-2xl">{formatNumber(s.totals.orders)}</b></div>
        <div className="card p-4"><span className="text-sm text-slate">Conversion</span><b className="block font-display text-2xl">{conv == null ? "—" : `${conv} %`}</b><ConfidenceTag value={confidence(s.totals.views, s.totals.orders)} /></div>
        <div className="card p-4"><span className="text-sm text-slate">Chiffre d'affaires</span><b className="block font-display text-2xl">{formatPrice(s.totals.revenue)}</b>
          {lv !== "basic" && (() => { const d = delta(s.totals.revenue, s.totals.revenue_prev); return <span className="text-xs text-slate">{d == null ? "période précédente vide" : `${d >= 0 ? "+" : ""}${d} % vs période précédente`}</span>; })()}</div>
      </div>

      {findings.length > 0 && (
        <section className="card p-5"><h3 className="font-semibold">Ce que Shoppy AI observe</h3>
          <ul className="mt-3 space-y-3">{findings.map((f) => (
            <li key={f.kind + f.productId} className="rounded-xl border border-line p-3"><div className="flex flex-wrap items-center gap-2"><b>{f.title}</b><ConfidenceTag value={f.confidence} /></div>
              <p className="mt-1 text-sm text-slate">{f.text}</p>
              {f.productId && <Link href={`/vendeur/produits/${f.productId}`} className="link mt-1 inline-block text-sm">Modifier la fiche</Link>}</li>))}</ul></section>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="card min-w-0 p-5"><h3 className="font-semibold">Meilleures ventes</h3>
          {best.length ? <ol className="mt-3 space-y-2 text-sm">{best.map((p, i) => <li key={p.id} className="flex min-w-0 justify-between gap-3"><span className="min-w-0 truncate">{i + 1}. {p.title}</span><span className="shrink-0 text-slate">{p.units} vendu(s) · {formatPrice(p.revenue)}</span></li>)}</ol>
            : <p className="mt-2 text-sm text-slate">Aucune vente sur la période.</p>}</section>
        <section className="card min-w-0 p-5"><h3 className="font-semibold">Produits sans vente</h3>
          {weak.length ? <ul className="mt-3 space-y-2 text-sm">{weak.map((p) => <li key={p.id} className="flex min-w-0 justify-between gap-3"><Link href={`/vendeur/produits/${p.id}`} className="min-w-0 truncate hover:underline">{p.title}</Link><span className="shrink-0 text-slate">{p.views} consultation(s)</span></li>)}</ul>
            : <p className="mt-2 text-sm text-slate">Tous vos produits publiés se sont vendus au moins une fois.</p>}</section>
      </div>

      {lv !== "basic" && (
        <section className="card overflow-x-auto p-5"><h3 className="font-semibold">Détail par produit</h3>
          {topDay && topDay.orders > 0 && <p className="mt-1 text-sm text-slate">Jour le plus actif : <b className="text-ink">{WEEKDAYS[topDay.dow]}</b> ({topDay.orders} commande(s)).</p>}
          <table className="mt-3 w-full min-w-[560px] text-left text-sm">
            <thead className="text-xs text-slate"><tr><th className="py-2">Produit</th><th>Consult.</th><th>Évolution</th><th>Commandes</th><th>Conversion</th><th>CA terminé</th></tr></thead>
            <tbody className="divide-y divide-line">{pub.map((p) => { const d = delta(p.views, p.views_prev); const c = conversion(p.views, p.orders); return (
              <tr key={p.id}><td className="max-w-[220px] truncate py-2">{p.title}</td><td>{p.views}</td><td className={d == null ? "text-slate" : d >= 0 ? "text-success" : "text-danger"}>{d == null ? "—" : `${d >= 0 ? "+" : ""}${d} %`}</td>
                <td>{p.orders}</td><td>{c == null ? "—" : `${c} %`}</td><td>{formatPrice(p.revenue)}</td></tr>); })}</tbody>
          </table></section>
      )}
      {level("export") !== "none" ? (
        <section className="card flex flex-wrap items-center gap-3 p-5"><b className="mr-auto">Rapports exportables</b>
          <a href={`/api/export?type=produits&jours=${days}`} className="btn btn-sm btn-secondary press">Produits (CSV)</a>
          <a href={`/api/export?type=commandes&jours=${days}`} className="btn btn-sm btn-secondary press">Commandes (CSV)</a></section>
      ) : lv !== "basic" && <p className="text-sm text-slate">Exportation des rapports (CSV) : formule Business.</p>}
      {lv === "basic" && <p className="text-sm text-slate">Comparaison de périodes, détail par produit et jours les plus actifs : inclus à partir de la formule Pro. <Link href="/vendeur/abonnement" className="link">Voir les formules</Link></p>}
    </div>
  );
}
