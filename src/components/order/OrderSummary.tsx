import Image from "next/image";
import { formatDate, formatPrice, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/format";
import type { Order } from "@/lib/types";
import { OrderTimeline } from "./OrderTimeline";

export function OrderSummary({ order }: { order: Order }) {
  const items = order.order_items || [];
  return (
    <div className="space-y-10">
      <div className="border border-white/[0.1] bg-ink-2 p-6 md:p-8">
        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="label">Commande</p>
            <p className="display mt-1 text-3xl tracking-wide">{order.order_number}</p>
          </div>
          <p className="text-sm text-mist">{formatDate(order.created_at, true)}</p>
        </div>
        <OrderTimeline order={order} />
        {order.deliveries?.tracking_number && (
          <p className="mt-6 text-sm text-ivory/90">
            Suivi : {order.deliveries.carrier ? `${order.deliveries.carrier} — ` : ""}
            <span className="text-gold">{order.deliveries.tracking_number}</span>
          </p>
        )}
      </div>

      <div className="grid gap-px bg-white/[0.06] md:grid-cols-3">
        <div className="bg-ink p-6">
          <p className="label mb-3">Client</p>
          <p>{order.customer_name}</p>
          <p className="text-sm text-ivory/90">{order.phone}</p>
          {order.whatsapp && <p className="text-sm text-ivory/90">WhatsApp : {order.whatsapp}</p>}
        </div>
        <div className="bg-ink p-6">
          <p className="label mb-3">Livraison{order.zone_name ? ` — ${order.zone_name}` : ""}</p>
          <p className="text-sm">{order.address_line}</p>
          <p className="text-sm text-ivory/90">{[order.city, order.region].filter(Boolean).join(", ")}</p>
        </div>
        <div className="bg-ink p-6">
          <p className="label mb-3">Paiement</p>
          <p className="text-sm">{PAYMENT_METHOD_LABEL[order.payment_method]}</p>
          <p className={order.payment_status === "reussi" ? "text-sm text-success" : "text-sm text-gold"}>{PAYMENT_STATUS_LABEL[order.payment_status]}</p>
        </div>
      </div>

      <div>
        <ul className="divide-y divide-white/[0.06] border-y border-white/[0.1]">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-4 py-4">
              <span className="relative h-20 w-16 shrink-0 overflow-hidden bg-ink-3">
                {it.image_url && <Image src={it.image_url} alt="" fill sizes="64px" className="object-cover" />}
              </span>
              <span className="flex-1">
                <span className="display block text-xl">{it.product_name}</span>
                <span className="text-xs text-mist">
                  Réf. {it.reference}
                  {it.color ? ` · ${it.color}` : ""}
                  {it.size ? ` · ${it.size}` : ""} · Qté {it.quantity}
                </span>
              </span>
              <span className="text-sm">{formatPrice(it.line_total)}</span>
            </li>
          ))}
        </ul>
        <dl className="ml-auto mt-6 max-w-sm space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-mist">Sous-total</dt><dd>{formatPrice(order.subtotal)}</dd></div>
          {order.discount > 0 && <div className="flex justify-between text-gold"><dt>Réduction {order.coupon_code}</dt><dd>-{formatPrice(order.discount)}</dd></div>}
          <div className="flex justify-between"><dt className="text-mist">Livraison</dt><dd>{order.delivery_fee_pending ? "À confirmer" : order.delivery_fee ? formatPrice(order.delivery_fee) : "Offerte"}</dd></div>
          <div className="flex justify-between border-t border-white/[0.1] pt-3"><dt className="label">Total</dt><dd className="display text-2xl">{formatPrice(order.total)}</dd></div>
        </dl>
      </div>
    </div>
  );
}
