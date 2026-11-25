import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { EmptyState, PageTitle } from "@/components/ui/bits";
import { StatusPill } from "@/components/order/status";
import { formatDate, formatPrice } from "@/lib/format";
import type { Order } from "@/lib/types";

export const metadata: Metadata = { title: "Mes commandes", robots: { index: false } };

export default async function MyOrdersPage() {
  const user = await requireUser("/compte/commandes");
  const sb = await supabaseServer();
  const { data } = await sb.from("orders").select("*, shop:shops(name, slug), items:order_items(id)").eq("buyer_id", user.id).order("created_at", { ascending: false }).limit(100);
  const orders = (data ?? []) as (Order & { shop: { name: string; slug: string }; items: { id: string }[] })[];
  const active = orders.filter((o) => !["completed", "cancelled", "refused"].includes(o.status));
  const past = orders.filter((o) => ["completed", "cancelled", "refused"].includes(o.status));
  const List = ({ list }: { list: typeof orders }) => (
    <ul className="space-y-3">{list.map((o) => (
      <li key={o.id}><Link href={`/compte/commandes/${o.id}`} className="card press flex items-center justify-between gap-3 p-4 hover:border-[#cfd3db]">
        <div className="min-w-0"><p className="font-semibold">{o.shop?.name}</p><p className="text-xs text-slate">{o.number} · {formatDate(o.created_at)} · {o.items.length} article{o.items.length > 1 ? "s" : ""}</p>
          <div className="mt-2"><StatusPill status={o.status} /></div></div>
        <b className="shrink-0">{formatPrice(o.total)}</b></Link></li>))}</ul>
  );
  return (
    <div className="container-page max-w-2xl py-6 md:py-10">
      <PageTitle title="Mes commandes" back="/compte" />
      {!orders.length ? <EmptyState icon="package" title="Aucune commande pour le moment" text="Vos commandes et leur suivi apparaîtront ici." action={{ href: "/explorer", label: "Explorer le catalogue" }} /> : (
        <div className="space-y-8">
          {active.length > 0 && <section><h2 className="mb-3 font-semibold">En cours</h2><List list={active} /></section>}
          {past.length > 0 && <section><h2 className="mb-3 font-semibold">Historique</h2><List list={past} /></section>}
        </div>
      )}
    </div>
  );
}
