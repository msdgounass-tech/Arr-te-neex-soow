import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { startPayment } from "@/lib/payments";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({ orderNumber: z.string().max(40), token: z.string().uuid() });

/** Relance un paiement en ligne non abouti (le client doit détenir le jeton d'accès de la commande). */
export async function POST(req: Request) {
  if (!rateLimit(`retry:${clientIp(req)}`, 6, 60_000)) return NextResponse.json({ error: "Trop de tentatives." }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });

  const sb = getServiceSupabase();
  const { data: order } = await sb
    .from("orders")
    .select("id, order_number, access_token, total, customer_name, email, payment_method, payment_status, status, delivery_fee_pending")
    .eq("order_number", parsed.data.orderNumber)
    .eq("access_token", parsed.data.token)
    .maybeSingle();
  if (!order) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
  if (order.payment_status === "reussi" || order.status === "annulee" || order.payment_method === "livraison") {
    return NextResponse.json({ error: "Aucun paiement à relancer pour cette commande." }, { status: 400 });
  }
  if (order.delivery_fee_pending) {
    return NextResponse.json({ error: "Les frais de livraison doivent d'abord être confirmés par notre équipe." }, { status: 400 });
  }
  const { data: payment } = await sb.from("payments").select("id").eq("order_id", order.id).order("created_at", { ascending: false }).limit(1).single();
  if (!payment) return NextResponse.json({ error: "Paiement introuvable." }, { status: 404 });

  try {
    const r = await startPayment(order.payment_method, {
      paymentId: payment.id,
      orderId: order.id,
      orderNumber: order.order_number,
      accessToken: order.access_token,
      amount: order.total,
      customerName: order.customer_name,
      email: order.email,
    });
    const link = (r?.extra as { url?: string } | undefined)?.url;
    return NextResponse.json({ redirectUrl: r?.redirectUrl ?? link ?? null });
  } catch (e) {
    console.error("[payments/retry]", e);
    return NextResponse.json({ error: "Le prestataire de paiement est momentanément indisponible." }, { status: 502 });
  }
}
