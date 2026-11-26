import Link from "next/link";
import { requireShop } from "@/lib/auth";
import { getSellerOverview } from "@/lib/seller";
import { progressOf } from "@/lib/assistant";
import { StatCard } from "@/components/seller/StatCard";
import { Checklist } from "@/components/seller/Checklist";
import { Icon } from "@/components/ui/Icon";
import { formatNumber, formatPrice } from "@/lib/format";

export const metadata = { title: "Tableau de bord" };

export default async function SellerDashboard() {
  const { shop, canManage } = await requireShop();
  const o = await getSellerOverview(shop);
  const progress = progressOf(o.facts, o.manual);
  const s = o.stats;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-bold md:text-3xl">Tableau de bord</h1><p className="text-slate">{shop.name}</p></div>
        {canManage && <Link href="/vendeur/produits/nouveau" className="btn btn-primary press"><Icon name="plus" size={18} /> Ajouter un produit</Link>}
      </div>

      {o.orders.pending > 0 && (
        <Link href="/vendeur/commandes?statut=pending" className="press flex items-center gap-3 rounded-2xl bg-ink p-4 text-white">
          <Icon name="bell" /><span className="flex-1"><b>{o.orders.pending} commande{o.orders.pending > 1 ? "s" : ""} à confirmer.</b> Répondre vite améliore votre taux de réponse.</span><Icon name="chevron-right" />
        </Link>
      )}

      <section aria-labelledby="activity-title">
        <h2 id="activity-title" className="mb-3 font-semibold">Commandes</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="À confirmer" value={o.orders.pending} icon="bell" tone="orange" href="/vendeur/commandes?statut=pending" />
          <StatCard label="En cours" value={o.orders.inProgress} icon="truck" href="/vendeur/commandes?statut=en-cours" />
          <StatCard label="Terminées" value={o.orders.completed} icon="check" tone="success" href="/vendeur/commandes?statut=completed" />
          <StatCard label="Chiffre d'affaires (30 j)" value={formatPrice(s?.revenue_completed ?? 0)} icon="wallet" hint="Commandes terminées uniquement" />
        </div>
      </section>

      <section aria-labelledby="catalog-title">
        <h2 id="catalog-title" className="mb-3 font-semibold">Catalogue et visibilité (30 jours)</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Produits publiés" value={o.products.published} icon="tag" href="/vendeur/produits" />
          <StatCard label="Indisponibles" value={o.products.unavailable} icon="eye-off" href="/vendeur/produits?filtre=indisponibles" />
          <StatCard label="Visites de la boutique" value={formatNumber(s?.shop_views ?? 0)} icon="store" href="/vendeur/statistiques" />
          <StatCard label="Consultations de produits" value={formatNumber(s?.product_views ?? 0)} icon="eye" href="/vendeur/statistiques" />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Checklist steps={progress.steps} done={progress.done} total={progress.total} compact />
        <section className="card p-5">
          <h2 className="font-semibold">Qualité de présentation</h2>
          {o.products.averageQuality == null ? <p className="mt-2 text-sm text-slate">Publiez un produit pour obtenir votre premier score.</p> : (
            <>
              <p className="mt-2 font-display text-4xl font-bold">{o.products.averageQuality}<span className="text-lg text-slate"> / 100</span></p>
              <p className="text-sm text-slate">Score moyen de vos produits publiés. Il ne bloque jamais une publication : il vous indique quoi améliorer.</p>
            </>
          )}
          <Link href="/vendeur/confiance" className="link mt-3 inline-block text-sm">Voir les conseils</Link>
        </section>
      </div>
    </div>
  );
}
