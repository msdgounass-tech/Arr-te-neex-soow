import Link from "next/link";
import { getAiAccess } from "@/lib/ai/access";
import { formatPrice } from "@/lib/format";
import { DataNote, Locked } from "@/components/ai/Locked";

export const metadata = { title: "Mes concurrents" };
type Comp = {
  by_category: { category_id: number; category: string; my_count: number; my_median: number | null; market_count: number; market_min: number | null; market_median: number | null; market_max: number | null; market_promos: number; shops: number }[];
  missing_categories: { category_id: number; category: string; offers: number }[];
  shops: { name: string; slug: string; products: number; verified: boolean }[];
};

export default async function CompetitorsPage() {
  const { sb, level, matrix, plan } = await getAiAccess();
  const lv = level("competitors");
  if (lv === "none") return <Locked feature="competitors" matrix={matrix} expired={!plan} />;
  const { data } = await sb.rpc("ai_competitor_insights");
  const c = data as Comp;
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Analyser mes concurrents</h2>
      <DataNote>Uniquement des informations publiques des boutiques actives de Shoppy by MSD (produits publiés, prix affichés, promotions visibles). Aucun compte privé n'est consulté.
        Les boutiques externes (Facebook, Instagram, sites web) ne sont pas encore analysées : il faudrait un connecteur autorisé.</DataNote>
      <section className="card overflow-x-auto p-5"><h3 className="font-semibold">Vos prix face au marché, par catégorie</h3>
        {c.by_category.length ? <table className="mt-3 w-full min-w-[560px] text-left text-sm">
          <thead className="text-xs text-slate"><tr><th className="py-2">Catégorie</th><th>Vos produits</th><th>Votre médiane</th><th>Concurrents</th><th>Fourchette marché</th><th>Médiane</th><th>En promo</th></tr></thead>
          <tbody className="divide-y divide-line">{c.by_category.map((r) => (
            <tr key={r.category_id}><td className="py-2 font-medium">{r.category}</td><td>{r.my_count}</td><td>{r.my_median ? formatPrice(Math.round(r.my_median)) : "—"}</td>
              <td>{r.shops} boutique(s) · {r.market_count} offre(s)</td><td>{r.market_count ? `${formatPrice(r.market_min!)} – ${formatPrice(r.market_max!)}` : "—"}</td>
              <td>{r.market_median ? formatPrice(Math.round(r.market_median)) : "—"}</td><td>{r.market_promos}</td></tr>))}</tbody></table>
          : <p className="mt-2 text-sm text-slate">Publiez des produits avec une catégorie pour les comparer au marché.</p>}
      </section>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="card p-5"><h3 className="font-semibold">Catégories proposées par vos concurrents, pas par vous</h3>
          {c.missing_categories.length ? <ul className="mt-3 space-y-1 text-sm">{c.missing_categories.map((m) => <li key={m.category_id} className="flex justify-between"><span>{m.category}</span><span className="text-slate">{m.offers} offre(s)</span></li>)}</ul>
            : <p className="mt-2 text-sm text-slate">Vous couvrez déjà les catégories de vos concurrents.</p>}</section>
        <section className="card p-5"><h3 className="font-semibold">Boutiques de votre domaine</h3>
          {c.shops.length ? <ul className="mt-3 space-y-1 text-sm">{c.shops.map((s) => <li key={s.slug} className="flex justify-between gap-3"><Link href={`/b/${s.slug}`} className="truncate hover:underline">{s.name}{s.verified ? " ✓" : ""}</Link><span className="shrink-0 text-slate">{s.products} produit(s)</span></li>)}</ul>
            : <p className="mt-2 text-sm text-slate">Aucune autre boutique active dans votre domaine.</p>}</section>
      </div>
      <p className="text-sm text-slate">Besoin d'idées pour vous différencier ? <Link href="/vendeur/ia/conseiller?q=Comment+me+diff%C3%A9rencier+de+mes+concurrents+%3F" className="link">Demandez à Shoppy AI</Link>.</p>
    </div>
  );
}
