import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { StatCard } from "@/components/seller/StatCard";
import { StatusPill } from "@/components/order/status";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import type { Order } from "@/lib/types";

export const metadata = { title: "Vue d'ensemble" };

export default async function AdminHome() {
  const sb = await supabaseServer();
  const [{ data }, { data: orders }] = await Promise.all([
    sb.rpc("admin_overview"),
    sb.from("orders").select("id, number, status, total, created_at, shop:shops(name)").order("created_at", { ascending: false }).limit(8),
  ]);
  const o = (data ?? {}) as Record<string, number>;
  const recent = (orders ?? []) as unknown as (Pick<Order, "id" | "number" | "status" | "total" | "created_at"> & { shop: { name: string } | null })[];
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold md:text-3xl">Vue d'ensemble</h1>
      {(o.payments_pending > 0 || o.tickets_open > 0) && (
        <div className="grid gap-2 sm:grid-cols-2">
          {o.payments_pending > 0 && <Link href="/admin/paiements" className="press rounded-2xl bg-ink p-4 text-sm text-white"><b>{o.payments_pending} paiement{o.payments_pending > 1 ? "s" : ""} d'abonnement</b> à vérifier</Link>}
          {o.tickets_open > 0 && <Link href="/admin/signalements" className="press rounded-2xl bg-orange-strong p-4 text-sm text-white"><b>{o.tickets_open} signalement{o.tickets_open > 1 ? "s" : ""}</b> en attente</Link>}
        </div>
      )}
      <section><h2 className="mb-3 font-semibold">Utilisateurs et boutiques</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Comptes" value={formatNumber(o.users ?? 0)} icon="user" hint={`+${o.users_7d ?? 0} en 7 jours`} href="/admin/utilisateurs" />
          <StatCard label="Boutiques" value={formatNumber(o.shops ?? 0)} icon="store" hint={`${o.shops_public ?? 0} visibles · ${o.shops_demo ?? 0} démo`} href="/admin/boutiques" />
          <StatCard label="En essai" value={o.sub_trial ?? 0} icon="clock" tone="orange" href="/admin/boutiques?statut=trial" />
          <StatCard label="Abonnées" value={o.sub_active ?? 0} icon="check" tone="success" hint={`${o.sub_expired ?? 0} expirées · ${o.sub_suspended ?? 0} suspendues`} href="/admin/boutiques" />
        </div></section>
      <section><h2 className="mb-3 font-semibold">Activité</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Produits publiés" value={`${o.products_published ?? 0} / ${o.products ?? 0}`} icon="tag" href="/admin/produits" />
          <StatCard label="Commandes" value={formatNumber(o.orders ?? 0)} icon="package" hint={`+${o.orders_7d ?? 0} en 7 jours`} href="/admin/commandes" />
          <StatCard label="À confirmer / en cours" value={`${o.orders_pending ?? 0} / ${o.orders_in_progress ?? 0}`} icon="truck" href="/admin/commandes?statut=pending" />
          <StatCard label="Ventes terminées" value={formatPrice(o.sales_completed ?? 0)} icon="wallet" tone="success" hint={`${o.orders_completed ?? 0} commandes · ${o.orders_cancelled ?? 0} annulées`} />
        </div></section>
      <section className="card p-4"><div className="mb-2 flex items-center justify-between"><h2 className="font-semibold">Dernières commandes</h2><Link href="/admin/commandes" className="link text-sm">Tout voir</Link></div>
        <ul className="divide-y divide-line">{recent.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
            <div className="min-w-0"><p className="truncate font-medium">{r.number} · {r.shop?.name}</p><p className="text-xs text-slate">{formatDate(r.created_at, true)}</p></div>
            <div className="flex shrink-0 flex-col items-end gap-1"><b>{formatPrice(r.total)}</b><StatusPill status={r.status} /></div>
          </li>))}</ul>
        {!recent.length && <p className="text-sm text-slate">Aucune commande pour le moment.</p>}
      </section>
      <p className="text-xs text-slate">Les montants de vente sont ceux déclarés par les commandes terminées ; MSD Shoppy n'encaisse pas ces sommes. Les abonnements sont suivis séparément dans Paiements.</p>
    </div>
  );
}
