import "server-only";
import type { PaymentMethod } from "@/lib/types";

/** Un moyen de paiement n'est proposé que si ses identifiants officiels sont configurés. */
export function paymentAvailability(): Record<PaymentMethod, boolean> {
  return {
    wave: Boolean(process.env.WAVE_API_KEY && process.env.WAVE_WEBHOOK_SECRET),
    orange_money: Boolean(
      process.env.ORANGE_MONEY_CLIENT_ID &&
        process.env.ORANGE_MONEY_CLIENT_SECRET &&
        process.env.ORANGE_MONEY_MERCHANT_CODE &&
        process.env.ORANGE_MONEY_WEBHOOK_TOKEN,
    ),
    carte: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
    livraison: true,
  };
}
