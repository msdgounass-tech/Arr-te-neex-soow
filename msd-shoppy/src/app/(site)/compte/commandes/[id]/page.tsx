import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { PageTitle } from "@/components/ui/bits";
import { OrderTimeline, StatusPill } from "@/components/order/status";
import { BuyerOrderActions } from "@/components/order/BuyerOrderActions";
import { ContactButtons } from "@/components/product/ContactButtons";
import { formatDate, formatPrice } from "@/lib/format";
import type { Order, OrderEvent, OrderItem, Shop } from "@/lib/types";

export const metadata: Metadata = { title: "Suivi de commande", robots: { index: false } };
const PAY: Record<string, string> = { cash_on_delivery: "À la livraison ou au retrait", wave_direct: "Wave, directement au vendeur", orange_money_direct: "Orange Money, directement au vendeur" };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/compte/commandes/${id}`);
  const sb = await supabaseServer();
  const { data } = await sb.from("orders").select("*, shop:shops(*), items:order_items(*), events:order_events(*)").eq("id", id).eq("buyer_id", user.id).maybeSingle();
  if (!data) notFound();
  const o = data as Order & { shop: Shop; items: OrderItem[]; events: OrderEvent[] };
  const { data: review } = await sb.from("reviews").select("id").eq("order_id", id).maybeSingle();
  return (
    <div className="container-page max-w-3xl py-6 md:py-10">
      <PageTitle title={`Commande ${o.number}`} subtitle={`Passée le ${formatDate(o.created_at, true)}`} back="/compte/commandes" />
      <div className="grid gap-5 md:grid-cols-[1fr_280px]">
        <div className="space-y-5">
          <section className="card p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Suivi</h2><StatusPill status={o.status} /></div>
            <OrderTimeline status={o.status} events={o.events.sort((a, b) => a.created_at.localeCompare(b.created_at))} /></section>
          <section className="card p-5"><h2 className="mb-3 font-semibold">Articles</h2>
            <ul className="divide-y divide-line">{o.items.map((it) => (
              <li key={it.id} className="flex gap-3 py-3"><div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-mist">{it.image_url && <Image src={it.image_url} alt="" fill sizes="64px" className="object-cover" />}</div>
                <div className="flex-1 text-sm"><p className="font-medium">{it.title}</p>{it.variant_label && <p className="text-slate">{it.variant_label}</p>}<p className="text-slate">{it.quantity} × {formatPrice(it.unit_price)}</p></div>
                <b className="text-sm">{formatPrice(it.line_total)}</b></li>))}</ul>
            <dl className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-slate">Articles</dt><dd>{formatPrice(o.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate">Livraison{o.delivery_label ? ` (${o.delivery_label})` : ""}</dt><dd>{o.delivery_fee == null ? "à convenir" : formatPrice(o.delivery_fee)}</dd></div>
              <div className="flex justify-between text-base"><dt className="font-semibold">Total</dt><dd className="font-bold">{formatPrice(o.total)}</dd></div>
            </dl></section>
        </div>
        <aside className="space-y-4">
          <BuyerOrderActions orderId={o.id} status={o.status} hasReview={Boolean(review)} />
          <section className="card space-y-3 p-4 text-sm"><h2 className="font-semibold">Vendeur</h2><Link href={`/b/${o.shop.slug}`} className="link">{o.shop.name}</Link>
            <ContactButtons shopId={o.shop.id} phone={o.shop.public_phone} whatsapp={o.shop.public_whatsapp} size="sm" message={`Bonjour ${o.shop.name}, je vous contacte au sujet de ma commande ${o.number} sur Shoppy by MSD.`} /></section>
          <section className="card p-4 text-sm"><h2 className="mb-2 font-semibold">Livraison</h2><p>{o.recipient_name}<br />{o.phone}<br />{o.city}, {o.region}{o.address_details ? <><br />{o.address_details}</> : null}</p>
            <h2 className="mb-1 mt-3 font-semibold">Paiement</h2><p>{PAY[o.payment_method]}</p></section>
        </aside>
      </div>
    </div>
  );
}
