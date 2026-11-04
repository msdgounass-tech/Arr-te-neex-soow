import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { formatDate, formatPrice, ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL, toWhatsAppNumber } from "@/lib/format";
import { Card, PageTitle, PaymentBadge, StatusBadge } from "@/components/admin/ui";
import { DeliveryFeeForm, DeliveryForm, ManualPaymentForm, StatusForm } from "@/components/admin/OrderForms";
import { markCodPaid } from "../../actions";
import type { Order } from "@/lib/types";
import { WhatsAppIcon } from "@/components/ui/Icons";

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb } = await requireRole("staff");
  const [{ data }, { data: payments }, { data: notifications }] = await Promise.all([
    sb.from("orders").select("*, order_items(*), order_status_history(id, status, note, created_at), deliveries(*)").eq("id", id).maybeSingle(),
    sb.from("payments").select("id, provider, amount, status, provider_reference, raw, created_at, updated_at").eq("order_id", id).order("created_at"),
    sb.from("notifications").select("id, channel, event, status, error, created_at").eq("order_id", id).order("created_at", { ascending: false }).limit(20),
  ]);
  if (!data) notFound();
  const o = data as Order & { deliveries: { carrier: string | null; tracking_number: string | null; scheduled_for: string | null; notes: string | null; status: string }[] | { carrier: string | null; tracking_number: string | null; scheduled_for: string | null; notes: string | null; status: string } | null };
  const delivery = Array.isArray(o.deliveries) ? o.deliveries[0] ?? null : o.deliveries;
  const wa = toWhatsAppNumber(o.whatsapp || o.phone);
  const waText = `Bonjour ${o.customer_name}, ici GOUNASS LUXURY au sujet de votre commande ${o.order_number} (${formatPrice(o.total)}).`;

  return (
    <>
      <Link href="/admin/commandes" className="text-[0.62rem] uppercase tracking-[0.2em] text-mist hover:text-gold">← Commandes</Link>
      <PageTitle title={o.order_number} subtitle={formatDate(o.created_at, true)}>
        <StatusBadge status={o.status} />
      </PageTitle>
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <Card>
            <p className="label mb-4">Articles</p>
            <ul className="divide-y divide-white/[0.05]">
              {(o.order_items || []).map((it) => (
                <li key={it.id} className="flex items-center gap-4 py-3">
                  <span className="relative h-16 w-12 shrink-0 overflow-hidden bg-ink-3">{it.image_url && <Image src={it.image_url} alt="" fill sizes="48px" className="object-cover" />}</span>
                  <span className="flex-1 text-sm">{it.product_name}<span className="block text-xs text-mist">SKU {it.sku} {it.color ? `· ${it.color}` : ""} {it.size ? `· ${it.size}` : ""}</span></span>
                  <span className="text-sm text-mist">{it.quantity} × {formatPrice(it.unit_price)}</span>
                  <span className="w-28 text-right text-sm">{formatPrice(it.line_total)}</span>
                </li>
              ))}
            </ul>
            <dl className="ml-auto mt-4 max-w-xs space-y-1 text-sm">
              <div className="flex justify-between"><dt className="text-mist">Sous-total</dt><dd>{formatPrice(o.subtotal)}</dd></div>
              {o.discount > 0 && <div className="flex justify-between text-gold"><dt>Code {o.coupon_code}</dt><dd>-{formatPrice(o.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-mist">Livraison ({o.zone_name})</dt><dd>{o.delivery_fee_pending ? "À confirmer" : formatPrice(o.delivery_fee)}</dd></div>
              <div className="flex justify-between border-t border-white/[0.06] pt-2 text-base"><dt>Total</dt><dd className="text-gold">{formatPrice(o.total)}</dd></div>
            </dl>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <p className="label mb-3">Client</p>
              <p>{o.customer_name}</p>
              <p className="text-sm text-ivory/70"><a href={`tel:${o.phone}`}>{o.phone}</a></p>
              {o.whatsapp && <p className="text-sm text-ivory/70">WhatsApp : {o.whatsapp}</p>}
              {o.email && <p className="text-sm text-ivory/70">{o.email}</p>}
              <p className="mt-1 text-xs text-mist">{o.user_id ? "Client avec compte" : "Commande invitée"}</p>
              <a href={`https://wa.me/${wa}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline mt-4 min-h-10 w-full"><WhatsAppIcon /> Contacter</a>
            </Card>
            <Card>
              <p className="label mb-3">Adresse de livraison</p>
              <p className="text-sm">{o.address_line}</p>
              <p className="text-sm text-ivory/70">{[o.city, o.region].filter(Boolean).join(", ")}</p>
              {o.notes && <p className="mt-3 border-l border-gold/40 pl-3 text-sm italic text-ivory/70">{o.notes}</p>}
              {o.delivery_lat != null && o.delivery_lng != null && (
                <a href={`https://www.google.com/maps/search/?api=1&query=${o.delivery_lat},${o.delivery_lng}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline mt-4 min-h-10 w-full">
                  Ouvrir la position GPS{o.delivery_km != null ? ` · ${o.delivery_km} km` : ""}
                </a>
              )}
            </Card>
          </div>

          <Card>
            <p className="label mb-3">Paiement — {PAYMENT_METHOD_LABEL[o.payment_method]} · <PaymentBadge status={o.payment_status} /></p>
            <ul className="space-y-2 text-xs text-mist">
              {(payments || []).map((p) => (
                <li key={p.id}>{formatDate(p.updated_at, true)} — {formatPrice(p.amount)} — {p.status}{p.provider_reference ? ` — réf. ${p.provider_reference}` : ""}</li>
              ))}
            </ul>
            {o.payment_method === "livraison" && o.payment_status !== "reussi" && o.status !== "annulee" && (
              <form action={markCodPaid} className="mt-4">
                <input type="hidden" name="id" value={o.id} />
                <button className="btn btn-ghost-gold min-h-10">Marquer comme encaissé</button>
              </form>
            )}
            {(() => {
              const last = (payments || []).at(-1) as { raw?: { mode?: string } | null; status: string } | undefined;
              const linkMode = last?.raw?.mode === "lien";
              if (o.payment_method === "livraison") return null;
              if (linkMode && o.payment_status !== "reussi" && o.status !== "annulee" && !o.delivery_fee_pending) return <ManualPaymentForm id={o.id} label={PAYMENT_METHOD_LABEL[o.payment_method]} />;
              return <p className="mt-3 text-xs text-mist">{linkMode ? "Paiement par lien marchand, confirmé manuellement après vérification." : "Les paiements en ligne sont confirmés uniquement par les webhooks signés des prestataires."}</p>;
            })()}
          </Card>

          <Card>
            <p className="label mb-3">Historique</p>
            <ul className="space-y-2 text-sm">
              {[...(o.order_status_history || [])].sort((a, b) => a.created_at.localeCompare(b.created_at)).map((h) => (
                <li key={h.id} className="flex gap-4"><span className="w-40 shrink-0 text-xs text-mist">{formatDate(h.created_at, true)}</span>{ORDER_STATUS_LABEL[h.status]}{h.note ? ` — ${h.note}` : ""}</li>
              ))}
            </ul>
            {notifications && notifications.length > 0 && (
              <>
                <p className="label mb-3 mt-6">Notifications</p>
                <ul className="space-y-1 text-xs text-mist">
                  {notifications.map((n) => <li key={n.id}>{formatDate(n.created_at, true)} — {n.channel} · {n.event} · <span className={n.status === "failed" ? "text-danger" : n.status === "sent" ? "text-success" : ""}>{n.status}</span>{n.error ? ` (${n.error.slice(0, 80)})` : ""}</li>)}
                </ul>
              </>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          {o.delivery_fee_pending && o.status !== "annulee" && (
            <Card className="border-gold/40"><p className="label mb-2 text-gold">Frais de livraison à confirmer</p><p className="mb-4 text-xs text-mist">Le client attend le montant. Le paiement en ligne lui sera proposé ensuite.</p><DeliveryFeeForm id={o.id} current={o.delivery_fee} /></Card>
          )}
          <Card><p className="label mb-4">Statut de la commande</p><StatusForm id={o.id} status={o.status} /></Card>
          <Card><p className="label mb-4">Livraison {delivery ? `— ${delivery.status}` : ""}</p><DeliveryForm orderId={o.id} d={delivery} /></Card>
        </div>
      </div>
    </>
  );
}
