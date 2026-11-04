import "server-only";
import type { PaymentMethod, PaymentSettings } from "@/lib/types";

export type PaymentMode = "api" | "lien" | "livraison" | null;

const svc = () => Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

// Les intégrations par API exigent la clé service (webhooks signés → mise à jour en base).
const apiConfigured = {
  wave: () => svc() && Boolean(process.env.WAVE_API_KEY && process.env.WAVE_WEBHOOK_SECRET),
  orange_money: () =>
    svc() &&
    Boolean(process.env.ORANGE_MONEY_CLIENT_ID && process.env.ORANGE_MONEY_CLIENT_SECRET && process.env.ORANGE_MONEY_MERCHANT_CODE && process.env.ORANGE_MONEY_WEBHOOK_TOKEN),
  carte: () => svc() && Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
};

const isPayLink = (u: string | undefined) => Boolean(u && /^https:\/\/[^\s]+$/.test(u));

/**
 * Mode de chaque moyen de paiement :
 *  - « api »  : intégration officielle (confirmation automatique par webhook signé)
 *  - « lien » : lien marchand de la boutique (confirmation manuelle par l'équipe après vérification)
 *  - null     : indisponible
 */
export function paymentModes(settings?: PaymentSettings): Record<PaymentMethod, PaymentMode> {
  return {
    wave: apiConfigured.wave() ? "api" : isPayLink(settings?.wave_link) ? "lien" : null,
    orange_money: apiConfigured.orange_money() ? "api" : isPayLink(settings?.orange_money_link) ? "lien" : null,
    carte: apiConfigured.carte() ? "api" : null,
    livraison: "livraison",
  };
}

export function paymentAvailability(settings?: PaymentSettings): Record<PaymentMethod, boolean> {
  const m = paymentModes(settings);
  return { wave: !!m.wave, orange_money: !!m.orange_money, carte: !!m.carte, livraison: true };
}

/** Lien marchand avec le montant pré-rempli (le client vérifie le montant avant de valider). */
export function payLinkWithAmount(link: string, amount: number) {
  try {
    const u = new URL(link);
    u.searchParams.set("amount", String(amount));
    return u.toString();
  } catch {
    return link;
  }
}
