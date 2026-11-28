import Link from "next/link";
import { getAiAccess } from "@/lib/ai/access";
import { confidence, delta } from "@/lib/insights";
import { ConfidenceTag, DataNote, Locked } from "@/components/ai/Locked";

export const metadata = { title: "Produits gagnants" };
type Market = { categories: { id: number; name: string; domain_id: number; views: number; views_prev: number; supply: number; orders: number }[];
  unmet_searches: { term: string; count: number; avg_results: number }[]; total_events_30d: number };

export default async function MarketPage() {
  const { sb, level, matrix, plan, mine } = await getAiAccess();
  const lv = level("market");
  if (lv === "none") return <Locked feature="market" matrix={matrix} expired={!plan} />;
  const { data } = await sb.rpc("ai_market_insights");
  const m = data as Market;
  const cats = m.categories.filter((c) => lv === "advanced" || c.domain_id === mine.shop.domain_id)
    .map((c) => ({ ...c, growth: delta(c.views, c.views_prev), demandPerOffer: c.supply ? Math.round((c.views / c.supply) * 10) / 10 : null }))
    .sort((a, b) => (b.demandPerOffer ?? b.views) - (a.demandPerOffer ?? a.views));
  const shown = lv === "basic" ? cats.slice(0, 3) : cats;
  const conf = confidence(m.total_events_30d);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-bold">Trouver des produits gagnants</h2><ConfidenceTag value={conf} /></div>
      <DataNote>Source : l'activité réelle sur Shoppy by MSD au cours des 30 derniers jours (consultations, commandes, recherches), agrégée et anonyme.
        Les tendances des réseaux sociaux et des autres sites ne sont pas encore connectées : l'analyse ne couvre que la demande observée sur Shoppy.
        Aucun produit n'est garanti rentable.</DataNote>
      <section className="card overflow-x-auto p-5">
        <h3 className="font-semibold">Catégories où la demande dépasse l'offre</h3>
        <p className="mt-1 text-sm text-slate">Plus il y a de consultations par produit disponible, moins la concurrence est forte pour la demande actuelle.</p>
        {shown.length ? <table className="mt-3 w-full min-w-[520px] text-left text-sm">
          <thead className="text-xs text-slate"><tr><th className="py-2">Catégorie</th><th>Consultations</th><th>Évolution</th><th>Offres</th><th>Demande / offre</th><th>Commandes</th></tr></thead>
          <tbody className="divide-y divide-line">{shown.map((c) => (
            <tr key={c.id}><td className="py-2 font-medium">{c.name}</td><td>{c.views}</td>
              <td className={c.growth == null ? "text-slate" : c.growth >= 0 ? "text-success" : "text-danger"}>{c.growth == null ? "nouveau" : `${c.growth >= 0 ? "+" : ""}${c.growth} %`}</td>
              <td>{c.supply}</td><td><b>{c.demandPerOffer ?? "—"}</b></td><td>{c.orders}</td></tr>))}</tbody></table>
          : <p className="mt-2 text-sm text-slate">Pas encore assez d'activité dans votre domaine pour dégager une tendance.</p>}
        {lv === "basic" && <p className="mt-3 text-xs text-slate">Aperçu limité aux 3 premières catégories. L'analyse complète et les recherches non satisfaites sont incluses dans la formule Pro. <Link href="/vendeur/abonnement" className="link">Voir les formules</Link></p>}
      </section>
      {lv !== "basic" && (
        <section className="card p-5">
          <h3 className="font-semibold">Recherches mal couvertes</h3>
          <p className="mt-1 text-sm text-slate">Ce que les clients cherchent sur Shoppy et trouvent peu (moins de 3 résultats en moyenne).</p>
          {m.unmet_searches.length ? <ul className="mt-3 flex flex-wrap gap-2">{m.unmet_searches.map((u) => (
            <li key={u.term} className="rounded-full border border-line px-3 py-1 text-sm">« {u.term} » <span className="text-slate">· {u.count} recherche(s), {u.avg_results} résultat(s)</span></li>))}</ul>
            : <p className="mt-2 text-sm text-slate">Aucune recherche non satisfaite enregistrée ce mois-ci.</p>}
        </section>
      )}
      <p className="text-sm text-slate">Pour une idée précise, posez la question à <Link href="/vendeur/ia/conseiller" className="link">Shoppy AI</Link> : il croisera ces données avec votre boutique.</p>
    </div>
  );
}
