import { getAiAccess } from "@/lib/ai/access";
import { margin, type SalesInsights } from "@/lib/insights";
import { formatPrice } from "@/lib/format";
import { DataNote, Locked } from "@/components/ai/Locked";
import { PriceSimulator } from "@/components/ai/PriceSimulator";
import { ActionForm } from "@/components/account/forms";
import { saveCostAction } from "@/app/actions/ai";

export const metadata = { title: "Mes prix" };
type Comp = { by_category: { category_id: number; market_count: number; market_min: number | null; market_median: number | null; market_max: number | null; market_promos: number }[] };

export default async function PricingPage() {
  const { sb, level, matrix, plan } = await getAiAccess();
  const lv = level("pricing");
  if (lv === "none") return <Locked feature="pricing" matrix={matrix} expired={!plan} />;
  const [{ data }, comp] = await Promise.all([sb.rpc("ai_sales_insights", { p_days: 30 }), lv !== "basic" ? sb.rpc("ai_competitor_insights") : Promise.resolve({ data: null })]);
  const s = data as SalesInsights;
  const market = new Map(((comp.data as Comp | null)?.by_category ?? []).map((c) => [c.category_id, c]));
  const products = s.products.filter((p) => p.status !== "hidden");
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Optimisation des prix et rentabilité</h2>
      <DataNote>Vos coûts d'achat restent privés : ni les clients ni les autres vendeurs ne les voient. Les prix du marché sont les prix publics des autres boutiques actives de Shoppy by MSD dans la même catégorie ;
        les marchés et sites externes ne sont pas encore connectés. Aucun prix n'est modifié sans votre action.</DataNote>
      {products.length === 0 && <p className="text-sm text-slate">Ajoutez des produits pour analyser vos prix.</p>}
      <ul className="space-y-4">{products.map((p) => {
        const m = margin(p.price, p.unit_cost, p.extra_cost);
        const mk = p.category_id ? market.get(p.category_id) : undefined;
        const pos = mk?.market_median ? Math.round(((p.price - mk.market_median) / mk.market_median) * 100) : null;
        return (
          <li key={p.id} className="card space-y-3 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2"><b className="min-w-0 truncate">{p.title}</b><span className="font-display text-lg font-bold">{formatPrice(p.price)}</span></div>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <p>Marge : {m ? <b className={m.value < 0 ? "text-danger" : ""}>{formatPrice(m.value)} ({m.rate} %)</b> : <span className="text-slate">coût d'achat non renseigné</span>}</p>
              {lv !== "basic" && <p>Marché Shoppy : {mk && mk.market_count > 0
                ? <>{formatPrice(mk.market_min!)} – {formatPrice(mk.market_max!)}, médiane <b>{formatPrice(Math.round(mk.market_median!))}</b> ({mk.market_count} offre(s){mk.market_promos ? `, ${mk.market_promos} en promotion` : ""}).
                    {pos != null && <span className="text-slate"> Votre prix est {pos === 0 ? "dans la médiane" : `${Math.abs(pos)} % ${pos > 0 ? "au-dessus" : "en dessous"}`}.</span>}</>
                : <span className="text-slate">aucune offre comparable pour le moment.</span>}</p>}
            </div>
            <details className="rounded-xl bg-mist/60 p-3">
              <summary className="cursor-pointer text-sm font-semibold">Coûts et simulation</summary>
              <ActionForm action={saveCostAction} submitLabel="Enregistrer les coûts" className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <input type="hidden" name="productId" value={p.id} />
                <label className="block"><span className="label">Coût d'achat unitaire (F)</span><input name="unit" type="number" min={0} defaultValue={p.unit_cost ?? ""} className="field" /></label>
                <label className="block"><span className="label">Autres frais par unité (emballage, transport…)</span><input name="extra" type="number" min={0} defaultValue={p.extra_cost ?? ""} className="field" /></label>
              </ActionForm>
              <div className="mt-4"><PriceSimulator price={p.price} cost={p.unit_cost} extra={p.extra_cost} /></div>
            </details>
          </li>);
      })}</ul>
      {lv === "basic" && <p className="text-sm text-slate">Comparaison avec les prix du marché : formule Pro.</p>}
    </div>
  );
}
