import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { StatusPill } from "@/components/order/status";
import { EmptyState, PageTitle } from "@/components/ui/bits";
import { formatDate, formatPrice } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

export const metadata = { title: "Commandes" };
const TABS = [["", "Toutes"], ["pending", "À confirmer"], ["en-cours", "En cours"], ["completed", "Terminées"], ["annulees", "Annulées"]] as const;
type Row = { id: string; number: string; status: OrderStatus; total: number; created_at: string; recipient_name: string; city: string; shop: { name: string; slug: string } | null; items: { title: string; quantity: number }[] };

export default async function OrdersAdmin({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  const { statut = "" } = await searchParams;
  const sb = await supabaseServer();
  let q = sb.from("orders").select("id, number, status, total, created_at, recipient_name, city, shop:shops(name, slug), items:order_items(title, quantity)").order("created_at", { ascending: false }).limit(300);
  if (statut === "pending" || statut === "completed") q = q.eq("status", statut);
  if (statut === "en-cours") q = q.in("status", ["confirmed", "preparing", "shipped", "delivered"]);
  if (statut === "annulees") q = q.in("status", ["cancelled", "refused"]);
  const rows = ((await q).data ?? []) as unknown as Row[];
  return (
    <div>
      <PageTitle title="Toutes les commandes" subtitle="Lecture seule : chaque vendeur gère ses commandes." />
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        {TABS.map(([v, l]) => <Link key={v} href={v ? `/admin/commandes?statut=${v}` : "/admin/commandes"} aria-current={statut === v ? "page" : undefined} className="chip press shrink-0">{l}</Link>)}
      </div>
      {!rows.length ? <EmptyState icon="package" title="Aucune commande" /> : (
        <ul className="space-y-3">{rows.map((o) => (
          <li key={o.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><p className="font-semibold">{o.number}</p>
                <p className="truncate text-sm text-slate">{o.shop?.name} → {o.recipient_name}, {o.city}</p>
                <p className="text-xs text-slate">{formatDate(o.created_at, true)}</p></div>
              <div className="flex shrink-0 flex-col items-end gap-1"><b>{formatPrice(o.total)}</b><StatusPill status={o.status} /></div>
            </div>
            <p className="mt-2 line-clamp-2 text-xs text-slate">{o.items.map((i) => `${i.quantity} × ${i.title}`).join(" · ")}</p>
          </li>))}</ul>
      )}
    </div>
  );
}
