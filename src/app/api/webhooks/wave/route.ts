import { NextResponse } from "next/server";
import { fetchWaveSession, verifyWaveSignature } from "@/lib/payments/wave";
import { recordPaymentResult } from "@/lib/payments/record";

export const runtime = "nodejs";

/** Webhook Wave : signature vérifiée, puis relecture de la session auprès de l'API Wave. */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWaveSignature(raw, req.headers.get("wave-signature"))) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
  }
  let event: { type?: string; data?: { id?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  if (!event.type?.startsWith("checkout.session") || !event.data?.id) return NextResponse.json({ received: true });

  try {
    const session = await fetchWaveSession(event.data.id);
    const status =
      session.payment_status === "succeeded" ? "reussi" : session.payment_status === "cancelled" || session.checkout_status === "expired" ? "echoue" : null;
    if (!status || session.currency !== "XOF") return NextResponse.json({ received: true });
    await recordPaymentResult({
      paymentId: session.client_reference,
      provider: "wave",
      status,
      reference: session.id,
      amount: Number(session.amount),
      raw: { event: event.type, session },
    });
    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("[webhook wave]", e);
    return NextResponse.json({ error: "Traitement impossible" }, { status: 500 });
  }
}
