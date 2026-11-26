import Link from "next/link";
import { requireShop } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { StatCard } from "@/components/seller/StatCard";
import { BarChart } from "@/components/seller/BarChart";
import { MarkStepDone } from "@/components/seller/MarkStepDone";
import { formatNumber, formatPrice } from "@/lib/format";
import type { SellerStats } from "@/lib/types";

export const metadata = { title: "Statistiques" };

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ jours?: string }> }) {
  const { jours } = await searchParams;
  const days = [7, 30, 90].includes(Number(jours)) ? Number(jours) : 30;
  await requireShop();
  const sb = await supabaseServer();
  const { data } = await sb.rpc("seller_stats", { p_days: days });
  const s = data as SellerStats | null;
  const contacts = (s?.calls ?? 0) + (s?.whatsapp ?? 0);
  const conversion = s && s.product_views >= 20 ? Math.round((s.orders / s.product_views) * 1000) / 10 : null;
  return (
    <div className="space-y-6">
      <MarkStepDone stepKey="understand_stats" />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold md:text-3xl">Statistiques</h1>
        <nav aria-label="Période" className="flex rounded-full bg-mist p-1">
          {[7, 30, 90].map((d) => <Link key={d} href={`/vendeur/statistiques?jours=${d}`} aria-current={d === days ? "page" : undefined}
            className={`press rounded-full px-4 py-1.5 text-sm font-semibold ${d === days ? "bg-white shadow-sm" : "text-slate"}`}>{d} jours</Link>)}
        </nav>
      </div>
      {!s ? <p className="text-slate">Statistiques indisponibles pour le moment.</p> : (<>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Visites de la boutique" value={formatNumber(s.shop_views)} icon="store" />
          <StatCard label="Consultations de produits" value={formatNumber(s.product_views)} icon="eye" />
          <StatCard label="Contacts (appel + WhatsApp)" value={formatNumber(contacts)} icon="phone" hint={`${s.whatsapp} WhatsApp · ${s.calls} appels`} />
          <StatCard label="Ajouts en favori" value={formatNumber(s.favorites)} icon="heart" />
          <StatCard label="Commandes reçues" value={formatNumber(s.orders)} icon="package" tone="orange" />
          <StatCard label="Ventes confirmées" value={formatNumber(s.completed_orders)} icon="check" tone="success" hint="Commandes terminées" />
          <StatCard label="Chiffre d'affaires" value={formatPrice(s.revenue_completed)} icon="wallet" hint="Commandes terminées uniquement" />
          <StatCard label="Partages" value={formatNumber(s.shares)} icon="share" />
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <BarChart title="Consultations par jour" unit="consultations" data={s.series.map((d) => ({ day: d.day, value: d.views }))} />
          <BarChart title="Commandes reçues par jour" unit="commandes" data={s.series.map((d) => ({ day: d.day, value: d.orders }))} />
        </div>
        <section className="card p-5"><h2 className="font-semibold">Produits les plus consultés</h2>
          {s.top_products.length ? (
            <ol className="mt-3 space-y-2">{s.top_products.map((p, i) => {
              const pct = (p.views / s.top_products[0].views) * 100;
              return (<li key={p.id} className="text-sm"><div className="flex justify-between gap-3"><Link href={`/vendeur/produits/${p.id}`} className="truncate hover:underline">{i + 1}. {p.title}</Link><b>{p.views}</b></div>
                <div className="mt-1 h-1.5 rounded-full bg-mist"><div className="h-full rounded-full bg-orange-strong" style={{ width: `${pct}%` }} /></div></li>);
            })}</ol>
          ) : <p className="mt-2 text-sm text-slate">Aucune consultation sur la période.</p>}
        </section>
        <section className="card space-y-2 p-5 text-sm">
          <h2 className="font-semibold">Comment lire ces chiffres</h2>
          {conversion != null && <p><b>{conversion} %</b> des consultations de produits ont mené à une commande sur la période.</p>}
          <p className="text-slate">Une visite ou une consultation est comptée une fois par session de navigation. Vos propres visites ne sont jamais comptées.</p>
          <p className="text-slate">Les ventes confirmées correspondent aux commandes terminées sur MSD Shoppy. Les commandes annulées ou refusées, et les ventes conclues uniquement sur WhatsApp, n'y figurent pas.</p>
          <Link href="/vendeur/assistant#understand_stats" className="link inline-block">Guide : comprendre ses statistiques</Link>
        </section>
      </>)}
    </div>
  );
}
