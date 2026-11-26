import Image from "next/image";
import { notFound } from "next/navigation";
import { requireShop } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { PageTitle } from "@/components/ui/bits";
import { OrderTimeline, StatusPill, STATUS } from "@/components/order/status";
import { SellerOrderActions } from "@/components/seller/SellerOrderActions";
import { Icon } from "@/components/ui/Icon";
import { formatDate, formatPhone, formatPrice, telLink, whatsappLink } from "@/lib/format";
import type { Order, OrderEvent, OrderItem } from "@/lib/types";

const PAY: Record<string, string> = { cash_on_delivery: "À la livraison ou au retrait", wave_direct: "Wave, directement à vous", orange_money_direct: "Orange Money, directement à vous" };

export default async function SellerOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { shop } = await requireShop();
  const sb = await supabaseServer();
  const { data } = await sb.from("orders").select("*, items:order_items(*), events:order_events(*)").eq("id", id).eq("shop_id", shop.id).maybeSingle();
  if (!data) notFound();
  const o = data as Order & { items: OrderItem[]; events: OrderEvent[] };
  const msg = `Bonjour ${o.recipient_name}, c'est ${shop.name} (MSD Shoppy) au sujet de votre commande ${o.number} : ${STATUS[o.status].label.toLowerCase()}.`;
  const wa = whatsappLink(o.phone, msg); const tel = telLink(o.phone);
  return (
    <div>
      <PageTitle title={`Commande ${o.number}`} subtitle={`Reçue le ${formatDate(o.created_at, true)}`} back="/vendeur/commandes" />
      <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          <section className="card p-5"><h2 className="mb-3 font-semibold">Articles</h2>
            <ul className="divide-y divide-line">{o.items.map((it) => (
              <li key={it.id} className="flex gap-3 py-3"><div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-mist">{it.image_url && <Image src={it.image_url} alt="" fill sizes="64px" className="object-cover" />}</div>
                <div className="flex-1 text-sm"><p className="font-medium">{it.title}</p>{it.variant_label && <p className="text-slate">{it.variant_label}</p>}{it.sku && <p className="text-slate">Réf. {it.sku}</p>}<p className="text-slate">{it.quantity} × {formatPrice(it.unit_price)}</p></div>
                <b className="text-sm">{formatPrice(it.line_total)}</b></li>))}</ul>
            <dl className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-slate">Articles</dt><dd>{formatPrice(o.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate">Livraison{o.delivery_label ? ` (${o.delivery_label})` : ""}</dt><dd>{o.delivery_fee == null ? "à convenir avec le client" : formatPrice(o.delivery_fee)}</dd></div>
              <div className="flex justify-between text-base"><dt className="font-semibold">Total</dt><dd className="font-bold">{formatPrice(o.total)}</dd></div>
            </dl></section>
          <section className="card p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Historique</h2><StatusPill status={o.status} /></div>
            <OrderTimeline status={o.status} events={o.events.sort((a, b) => a.created_at.localeCompare(b.created_at))} /></section>
        </div>
        <aside className="space-y-4">
          <section className="card p-4"><h2 className="mb-3 font-semibold">Étape suivante</h2><SellerOrderActions orderId={o.id} status={o.status} /></section>
          <section className="card space-y-2 p-4 text-sm"><h2 className="font-semibold">Client</h2>
            <p>{o.recipient_name}<br />{formatPhone(o.phone)}<br />{o.city}, {o.region}{o.address_details ? <><br />{o.address_details}</> : null}</p>
            {o.note && <p className="rounded-xl bg-mist p-2"><b>Message :</b> {o.note}</p>}
            <p><b>Paiement :</b> {PAY[o.payment_method]}</p>
            <div className="flex gap-2 pt-1">
              {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-sm press flex-1"><Icon name="whatsapp" size={16} /> WhatsApp</a>}
              {tel && <a href={tel} className="btn btn-secondary btn-sm press flex-1"><Icon name="phone" size={16} /> Appeler</a>}
            </div>
            <p className="text-xs text-slate">Ces coordonnées sont partagées avec vous uniquement pour cette commande.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
