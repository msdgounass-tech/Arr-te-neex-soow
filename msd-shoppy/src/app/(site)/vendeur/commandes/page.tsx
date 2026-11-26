import Link from "next/link";
import { requireShop } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/bits";
import { StatusPill } from "@/components/order/status";
import { formatDate, formatPrice } from "@/lib/format";
import type { Order } from "@/lib/types";

export const metadata = { title: "Commandes" };
const TABS = [["", "Toutes"], ["pending", "À confirmer"], ["en-cours", "En cours"], ["completed", "Terminées"], ["annulees", "Annulées et refusées"]] as const;

export default async function SellerOrders({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  const { statut = "" } = await searchParams;
  const { shop } = await requireShop();
  const sb = await supabaseServer();
  let q = sb.from("orders").select("*, items:order_items(quantity)").eq("shop_id", shop.id).order("created_at", { ascending: false }).limit(200);
  if (statut === "pending" || statut === "completed") q = q.eq("status", statut);
  if (statut === "en-cours") q = q.in("status", ["confirmed", "preparing", "shipped", "delivered"]);
  if (statut === "annulees") q = q.in("status", ["cancelled", "refused"]);
  const { data } = await q;
  const orders = (data ?? []) as (Order & { items: { quantity: number }[] })[];
  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold md:text-3xl">Commandes</h1>
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        {TABS.map(([v, l]) => <Link key={v} href={v ? `/vendeur/commandes?statut=${v}` : "/vendeur/commandes"} aria-current={statut === v ? "page" : undefined} className="chip press">{l}</Link>)}
      </div>
      {!orders.length ? <EmptyState icon="package" title="Aucune commande ici" text="Les commandes passées sur MSD Shoppy apparaissent ici. Partagez vos produits pour recevoir vos premières commandes." action={{ href: "/vendeur/promouvoir", label: "Partager ma boutique" }} /> : (
        <ul className="space-y-3">{orders.map((o) => (
          <li key={o.id}><Link href={`/vendeur/commandes/${o.id}`} className="card press flex items-center justify-between gap-3 p-4 hover:border-[#cfd3db]">
            <div className="min-w-0"><p className="font-semibold">{o.number}</p>
              <p className="truncate text-sm text-slate">{o.recipient_name} · {o.city} · {o.items.reduce((s, i) => s + i.quantity, 0)} article(s) · {formatDate(o.created_at, true)}</p>
              <div className="mt-2"><StatusPill status={o.status} /></div></div>
            <b className="shrink-0">{formatPrice(o.total)}</b></Link></li>))}</ul>
      )}
    </div>
  );
}
