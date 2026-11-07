import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfile, hasRole } from "@/lib/auth";
import { AccountShell } from "@/components/account/AccountShell";
import { OrderSummary } from "@/components/order/OrderSummary";
import { RetryPayment } from "@/components/order/OrderActions";
import { ORDER_SELECT } from "@/lib/orders";
import type { Order } from "@/lib/types";

export const metadata: Metadata = { title: "Détail de commande", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb, user, profile } = await getProfile();
  const { data } = await sb.from("orders").select(ORDER_SELECT).eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!data) notFound();
  const order = data as Order & { deliveries: unknown };
  if (Array.isArray(order.deliveries)) order.deliveries = order.deliveries[0] ?? null;
  const awaiting = order.payment_method !== "livraison" && order.payment_status !== "reussi" && order.status !== "annulee";
  return (
    <AccountShell title="Détail de commande" active="/compte/commandes" isStaff={hasRole(profile?.role ?? "customer", "staff")}>
      <Link href="/compte/commandes" className="mb-8 inline-block text-[0.8rem] uppercase tracking-[0.24em] text-mist hover:text-accent">← Mes commandes</Link>
      {awaiting && order.access_token && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border border-accent/30 p-5">
          <p className="text-sm">Le paiement de cette commande est en attente.</p>
          <RetryPayment orderNumber={order.order_number} token={order.access_token} />
        </div>
      )}
      <OrderSummary order={order as Order} />
    </AccountShell>
  );
}
