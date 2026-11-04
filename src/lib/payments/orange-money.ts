import "server-only";
import { SITE_URL } from "@/lib/env";
import type { CheckoutResult, PaymentContext } from "./types";

/**
 * Orange Money Sénégal — API marchand Sonatel (https://developer.orange-sonatel.com).
 * Flux : jeton OAuth2 (client_credentials) → génération d'un QR code / lien profond
 * Max it / Orange Money → notification de paiement sur l'URL de callback déclarée.
 *
 * IMPORTANT : les chemins et formats ci-dessous suivent la documentation publique
 * « eWallet v4 QR Code ». Vérifiez-les avec la documentation fournie lors de
 * l'activation de votre compte marchand avant la mise en production.
 */
const base = () => (process.env.ORANGE_MONEY_BASE_URL || "https://api.orange-sonatel.com").replace(/\/$/, "");

async function getToken() {
  const res = await fetch(`${base()}/oauth/v1/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.ORANGE_MONEY_CLIENT_ID || "",
      client_secret: process.env.ORANGE_MONEY_CLIENT_SECRET || "",
    }),
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) throw new Error(`Orange Money (auth): ${json.error_description || res.status}`);
  return json.access_token as string;
}

export async function createOrangeMoneyCheckout(ctx: PaymentContext): Promise<CheckoutResult> {
  const token = await getToken();
  const back = `${SITE_URL}/commande/confirmation/${ctx.orderNumber}?t=${ctx.accessToken}`;
  const res = await fetch(`${base()}/api/eWallet/v4/qrcode`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: { unit: "XOF", value: ctx.amount },
      code: process.env.ORANGE_MONEY_MERCHANT_CODE,
      name: process.env.ORANGE_MONEY_MERCHANT_NAME || "GOUNASS LUXURY",
      callbackSuccessUrl: `${back}&retour=orange`,
      callbackCancelUrl: `${back}&retour=orange-annule`,
      validity: 900,
      metadata: { payment_id: ctx.paymentId, order_number: ctx.orderNumber },
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Orange Money: ${json.detail || json.title || res.status}`);
  const link = json.deepLinks?.MAXIT || json.deepLinks?.OM || json.deepLink || json.shortLink || null;
  return {
    providerReference: json.qrId || json.reference || ctx.paymentId,
    redirectUrl: link,
    extra: { qrCode: json.qrCode || null, shortLink: json.shortLink || null },
  };
}
