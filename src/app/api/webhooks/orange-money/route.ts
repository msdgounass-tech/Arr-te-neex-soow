import { NextResponse } from "next/server";
import { safeEqual } from "@/lib/crypto";
import { recordPaymentResult } from "@/lib/payments/record";

export const runtime = "nodejs";

/**
 * Notification de paiement Orange Money (Sonatel).
 * Déclarez chez Sonatel l'URL : https://VOTRE-DOMAINE/api/webhooks/orange-money?token=ORANGE_MONEY_WEBHOOK_TOKEN
 * Contrôles : jeton secret, statut SUCCESS, devise XOF, montant identique à la commande.
 */
export async function POST(req: Request) {
  const expected = process.env.ORANGE_MONEY_WEBHOOK_TOKEN;
  const token = new URL(req.url).searchParams.get("token") || req.headers.get("x-webhook-token") || "";
  if (!expected || !safeEqual(token, expected)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    status?: string;
    transactionId?: string;
    amount?: { value?: number | string; unit?: string };
    metadata?: { payment_id?: string };
  } | null;
  const paymentId = body?.metadata?.payment_id;
  if (!body || !paymentId) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  if (body.amount?.unit && body.amount.unit !== "XOF") return NextResponse.json({ error: "Devise invalide" }, { status: 400 });

  const s = (body.status || "").toUpperCase();
  const status = s === "SUCCESS" ? "reussi" : s === "FAILED" || s === "CANCELLED" || s === "REJECTED" ? "echoue" : null;
  if (!status) return NextResponse.json({ received: true });

  try {
    await recordPaymentResult({
      paymentId,
      provider: "orange_money",
      status,
      reference: body.transactionId || null,
      amount: body.amount?.value != null ? Number(body.amount.value) : null,
      raw: body,
    });
    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("[webhook orange]", e);
    return NextResponse.json({ error: "Traitement impossible" }, { status: 500 });
  }
}
