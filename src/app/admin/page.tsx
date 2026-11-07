import Link from "next/link";
import { requireRole, hasRole } from "@/lib/auth";
import { formatDate, formatPrice } from "@/lib/format";
import { Card, PageTitle, PaymentBadge, StatusBadge, td, th } from "@/components/admin/ui";
import { SalesChart } from "@/components/admin/SalesChart";
import type { Order } from "@/lib/types";
import { OrderCards } from "@/components/admin/OrderCards";

interface Stats {
  revenue: number;
  revenue_period: number;
  orders: number;
  orders_period: number;
  pending: number;
  customers: number;
  average_basket: number;
  low_stock: number;
  daily: { day: string; revenue: number; orders: number }[];
  top_products: { name: string; quantity: number; revenue: number }[];
}

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ jours?: string }> }) {
  const { sb, role } = await requireRole("staff");
  const days = [7, 30, 90].includes(Number((await searchParams).jours)) ? Number((await searchParams).jours) : 30;
  const canStats = hasRole(role, "manager");
  const [{ data: stats }, { data: recent }] = await Promise.all([
    canStats ? sb.rpc("admin_stats", { p_days: days }) : Promise.resolve({ data: null }),
    sb.from("orders").select("id, order_number, customer_name, phone, city, total, status, payment_status, payment_method, created_at").order("created_at", { ascending: false }).limit(8),
  ]);
  const s = stats as Stats | null;

  const kpis = s
    ? [
        ["Chiffre d'affaires encaissé", formatPrice(s.revenue), `${formatPrice(s.revenue_period)} sur ${days} j`],
        ["Commandes", String(s.orders), `${s.orders_period} sur ${days} j`],
        ["En attente", String(s.pending), "à traiter"],
        ["Clients inscrits", String(s.customers), `Panier moyen ${formatPrice(s.average_basket)}`],
      ]
    : [];

  return (
    <>
      <PageTitle title="Tableau de bord" subtitle="Données réelles issues de la base de la boutique.">
        {canStats && [7, 30, 90].map((d) => (
          <Link key={d} href={`/admin?jours=${d}`} className={`px-3 py-1.5 text-[0.8rem] uppercase tracking-[0.2em] ${d === days ? "bg-accent text-ink" : "border border-white/15 text-ivory/90"}`}>{d} jours</Link>
        ))}
      </PageTitle>

      {s && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map(([label, value, hint]) => (
              <Card key={label}>
                <p className="label">{label}</p>
                <p className="display mt-3 text-3xl">{value}</p>
                <p className="mt-1 text-xs text-mist">{hint}</p>
              </Card>
            ))}
          </div>
          <div className="mt-4 grid gap-4 xl:grid-cols-[2fr_1fr]">
            <Card>
              <p className="label mb-6">Évolution des ventes encaissées — {days} jours</p>
              <SalesChart data={s.daily} />
            </Card>
            <Card>
              <p className="label mb-5">Produits les plus vendus</p>
              {s.top_products.length ? (
                <ol className="space-y-4">
                  {s.top_products.map((p, i) => (
                    <li key={p.name} className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate"><span className="mr-3 text-accent">{i + 1}.</span>{p.name}</span>
                      <span className="shrink-0 text-mist">{p.quantity} · {formatPrice(p.revenue)}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-mist">Aucune vente enregistrée pour le moment.</p>
              )}
              {s.low_stock > 0 && (
                <Link href="/admin/produits?stock=faible" className="mt-8 block border border-accent/30 p-3 text-xs text-accent">
                  {s.low_stock} déclinaison(s) en stock faible →
                </Link>
              )}
            </Card>
          </div>
        </>
      )}

      <Card className="mt-4 overflow-x-auto p-4 md:p-6">
        <div className="mb-4 flex items-baseline justify-between">
          <p className="label">Dernières commandes</p>
          <Link href="/admin/commandes" className="text-[0.8rem] uppercase tracking-[0.2em] text-accent">Toutes les commandes</Link>
        </div>
        {recent && recent.length ? (
          <>
          <div className="md:hidden"><OrderCards orders={recent as Order[]} /></div>
          <table className="hidden w-full min-w-[640px] text-sm md:table">
            <thead><tr><th className={th}>N°</th><th className={th}>Client</th><th className={th}>Date</th><th className={th}>Statut</th><th className={th}>Paiement</th><th className={`${th} text-right`}>Total</th></tr></thead>
            <tbody className="divide-y divide-white/[0.05]">
              {(recent as Order[]).map((o) => (
                <tr key={o.id}>
                  <td className={td}><Link href={`/admin/commandes/${o.id}`} className="text-accent">{o.order_number}</Link></td>
                  <td className={td}>{o.customer_name}</td>
                  <td className={`${td} text-mist`}>{formatDate(o.created_at, true)}</td>
                  <td className={td}><StatusBadge status={o.status} /></td>
                  <td className={td}><PaymentBadge status={o.payment_status} /></td>
                  <td className={`${td} text-right`}>{formatPrice(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </>
        ) : (
          <p className="text-sm text-mist">Aucune commande pour le moment.</p>
        )}
      </Card>
    </>
  );
}
