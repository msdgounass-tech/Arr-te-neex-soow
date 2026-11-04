import { NextResponse } from "next/server";
import { verifyStripeSignature } from "@/lib/payments/stripe";
import { recordPaymentResult } from "@/lib/payments/record";

export const runtime = "nodejs";

interface StripeSession {
  id: string;
  payment_status: string;
  amount_total: number;
  currency: string;
  client_reference_id: string | null;
  metadata?: { payment_id?: string };
}

/** Webhook Stripe : vérification de l'en-tête Stripe-Signature avant tout traitement. */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyStripeSignature(raw, req.headers.get("stripe-signature"))) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
  }
  const event = JSON.parse(raw) as { type: string; data: { object: StripeSession } };
  const s = event.data.object;
  const paymentId = s.metadata?.payment_id || s.client_reference_id;
  if (!paymentId) return NextResponse.json({ received: true });

  let status: "reussi" | "echoue" | null = null;
  if ((event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") && s.payment_status === "paid") status = "reussi";
  if (event.type === "checkout.session.async_payment_failed" || event.type === "checkout.session.expired") status = "echoue";
  if (!status || s.currency !== "xof") return NextResponse.json({ received: true });

  try {
    await recordPaymentResult({ paymentId, provider: "carte", status, reference: s.id, amount: s.amount_total, raw: { type: event.type, id: s.id, payment_status: s.payment_status } });
    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("[webhook stripe]", e);
    return NextResponse.json({ error: "Traitement impossible" }, { status: 500 });
  }
}
