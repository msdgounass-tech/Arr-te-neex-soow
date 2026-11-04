import "server-only";
import { SITE_URL } from "@/lib/env";
import { hmacHex, parseSignatureHeader, safeEqual } from "@/lib/crypto";
import type { CheckoutResult, PaymentContext } from "./types";

/**
 * Carte bancaire via Stripe Checkout (API REST officielle).
 * Le XOF est une devise « zero-decimal » chez Stripe : le montant est envoyé tel quel.
 */
export async function createStripeCheckout(ctx: PaymentContext): Promise<CheckoutResult> {
  const back = `${SITE_URL}/commande/confirmation/${ctx.orderNumber}?t=${ctx.accessToken}`;
  const body = new URLSearchParams({
    mode: "payment",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "xof",
    "line_items[0][price_data][unit_amount]": String(ctx.amount),
    "line_items[0][price_data][product_data][name]": `Commande ${ctx.orderNumber} — GOUNASS LUXURY`,
    client_reference_id: ctx.paymentId,
    "metadata[payment_id]": ctx.paymentId,
    "metadata[order_number]": ctx.orderNumber,
    "payment_intent_data[metadata][payment_id]": ctx.paymentId,
    success_url: `${back}&retour=carte`,
    cancel_url: `${back}&retour=carte-annule`,
    locale: "fr",
  });
  if (ctx.email) body.set("customer_email", ctx.email);

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Idempotency-Key": `${ctx.paymentId}-${Date.now()}`,
    },
    body,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.url) throw new Error(`Stripe: ${json.error?.message || res.status}`);
  return { providerReference: json.id, redirectUrl: json.url };
}

/** Vérifie l'en-tête Stripe-Signature (HMAC-SHA256 de « t.corps »). */
export function verifyStripeSignature(rawBody: string, header: string | null, toleranceSec = 300) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return false;
  const { t, v1 } = parseSignatureHeader(header);
  if (!t || !v1.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > toleranceSec) return false;
  const expected = hmacHex(secret, `${t}.${rawBody}`);
  return v1.some((s) => safeEqual(s, expected));
}
