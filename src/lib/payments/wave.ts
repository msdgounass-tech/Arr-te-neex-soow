import "server-only";
import { SITE_URL } from "@/lib/env";
import { hmacHex, parseSignatureHeader, safeEqual } from "@/lib/crypto";
import type { CheckoutResult, PaymentContext } from "./types";

/**
 * Wave Checkout API — https://docs.wave.com/checkout
 * Création d'une session, redirection du client vers wave_launch_url,
 * confirmation EXCLUSIVEMENT via webhook signé + relecture de la session.
 */
const API = "https://api.wave.com/v1";

export async function createWaveCheckout(ctx: PaymentContext): Promise<CheckoutResult> {
  const back = `${SITE_URL}/commande/confirmation/${ctx.orderNumber}?t=${ctx.accessToken}`;
  const res = await fetch(`${API}/checkout/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WAVE_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `${ctx.paymentId}-${Date.now()}`,
    },
    body: JSON.stringify({
      amount: String(ctx.amount),
      currency: "XOF",
      client_reference: ctx.paymentId,
      success_url: `${back}&retour=wave`,
      error_url: `${back}&retour=wave-erreur`,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.wave_launch_url) {
    throw new Error(`Wave: ${json.message || json.code || res.status}`);
  }
  return { providerReference: json.id, redirectUrl: json.wave_launch_url };
}

/** Vérifie l'en-tête Wave-Signature (HMAC-SHA256 de timestamp + corps brut). */
export function verifyWaveSignature(rawBody: string, header: string | null, toleranceSec = 300) {
  const secret = process.env.WAVE_WEBHOOK_SECRET;
  if (!secret) return false;
  const { t, v1 } = parseSignatureHeader(header);
  if (!t || !v1.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > toleranceSec) return false;
  const expected = hmacHex(secret, t + rawBody);
  return v1.some((s) => safeEqual(s, expected));
}

export async function fetchWaveSession(id: string) {
  const res = await fetch(`${API}/checkout/sessions/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${process.env.WAVE_API_KEY}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Wave session ${res.status}`);
  return res.json() as Promise<{ id: string; amount: string; currency: string; client_reference: string; payment_status: string; checkout_status: string; transaction_id?: string }>;
}
