import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrderByToken } from "@/lib/orders";
import { startPayment } from "@/lib/payments";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({ orderNumber: z.string().max(40), token: z.string().uuid() });

/** Relance un paiement non abouti (le client doit détenir le jeton d'accès de la commande). */
export async function POST(req: Request) {
  if (!rateLimit(`retry:${clientIp(req)}`, 6, 60_000)) return NextResponse.json({ error: "Trop de tentatives." }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });

  const res = await getOrderByToken(parsed.data.orderNumber, parsed.data.token);
  if (!res) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
  const order = res.order as typeof res.order & { access_token: string; payment?: { id: string } | null };
  if (order.payment_status === "reussi" || order.status === "annulee" || order.payment_method === "livraison") {
    return NextResponse.json({ error: "Aucun paiement à relancer pour cette commande." }, { status: 400 });
  }
  if (order.delivery_fee_pending) {
    return NextResponse.json({ error: "Les frais de livraison doivent d'abord être confirmés par notre équipe." }, { status: 400 });
  }
  const paymentId = order.payment?.id;
  if (!paymentId) return NextResponse.json({ error: "Paiement introuvable." }, { status: 404 });

  try {
    const r = await startPayment(order.payment_method, {
      paymentId,
      orderId: order.id,
      orderNumber: order.order_number,
      accessToken: parsed.data.token,
      amount: order.total,
      customerName: order.customer_name,
      email: order.email,
    });
    const link = (r?.extra as { url?: string } | undefined)?.url;
    return NextResponse.json({ redirectUrl: r?.redirectUrl ?? link ?? null });
  } catch (e) {
    console.error("[payments/retry]", e);
    return NextResponse.json({ error: "Le paiement ne peut pas être lancé pour le moment." }, { status: 502 });
  }
}
