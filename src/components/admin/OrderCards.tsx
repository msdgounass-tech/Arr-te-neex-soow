import Link from "next/link";
import { formatDate, formatPrice, PAYMENT_METHOD_LABEL } from "@/lib/format";
import type { Order } from "@/lib/types";
import { PaymentBadge, StatusBadge } from "./ui";
import { OrderQuickActions } from "./OrderQuickActions";

/** Liste de commandes en cartes (affichage mobile) avec actions directes. */
export function OrderCards({ orders }: { orders: Pick<Order, "id" | "order_number" | "customer_name" | "phone" | "city" | "total" | "status" | "payment_status" | "payment_method" | "created_at">[] }) {
  if (!orders.length) return <p className="py-8 text-center text-sm text-mist">Aucune commande.</p>;
  return (
    <ul className="space-y-3">
      {orders.map((o) => (
        <li key={o.id} className="border border-white/[0.12] bg-ink-2 p-4">
          <Link href={`/admin/commandes/${o.id}`} className="block">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold tracking-wide text-accent">{o.order_number}</p>
                <p className="mt-0.5 text-xs text-mist">{formatDate(o.created_at, true)}</p>
              </div>
              <p className="display shrink-0 text-xl text-ivory">{formatPrice(o.total)}</p>
            </div>
            <p className="mt-3 text-sm text-ivory">
              {o.customer_name}
              {o.city ? <span className="text-mist"> · {o.city}</span> : null}
            </p>
            {o.phone && <p className="text-sm text-mist">{o.phone}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
              <StatusBadge status={o.status} />
              <span className="text-xs text-mist">{PAYMENT_METHOD_LABEL[o.payment_method]} ·</span>
              <PaymentBadge status={o.payment_status} />
            </div>
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.08] pt-4">
            <OrderQuickActions id={o.id} status={o.status} size="sm" withCancel={false} />
            <Link href={`/admin/commandes/${o.id}`} className="btn btn-outline min-h-11 px-4 text-[0.7rem]">
              Détails
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
