import type { Metadata } from "next";
import Link from "next/link";
import { getProfile, hasRole } from "@/lib/auth";
import { AccountShell } from "@/components/account/AccountShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatPrice, ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/format";
import type { Order } from "@/lib/types";

export const metadata: Metadata = { title: "Mes commandes", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const { sb, user, profile } = await getProfile();
  const { data } = await sb.from("orders").select("id, order_number, status, payment_status, total, created_at").eq("user_id", user.id).order("created_at", { ascending: false });
  const orders = (data || []) as Pick<Order, "id" | "order_number" | "status" | "payment_status" | "total" | "created_at">[];
  return (
    <AccountShell title="Mes commandes" active="/compte/commandes" isStaff={hasRole(profile?.role ?? "customer", "staff")}>
      {orders.length === 0 ? (
        <EmptyState title="Aucune commande" text="Vos commandes apparaîtront ici." cta={{ href: "/shop", label: "Explorer la boutique" }} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="label border-b border-white/[0.06]">
              <tr><th className="py-3 font-normal">Commande</th><th className="font-normal">Date</th><th className="font-normal">Statut</th><th className="font-normal">Paiement</th><th className="text-right font-normal">Total</th></tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-ink-2">
                  <td className="py-4"><Link href={`/compte/commandes/${o.id}`} className="tracking-wider text-gold">{o.order_number}</Link></td>
                  <td className="text-mist">{formatDate(o.created_at)}</td>
                  <td>{ORDER_STATUS_LABEL[o.status]}</td>
                  <td className="text-mist">{PAYMENT_STATUS_LABEL[o.payment_status]}</td>
                  <td className="text-right">{formatPrice(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AccountShell>
  );
}
