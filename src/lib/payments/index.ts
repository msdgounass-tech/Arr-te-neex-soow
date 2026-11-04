import "server-only";
import { getServiceSupabase } from "@/lib/supabase/admin";
import type { PaymentMethod } from "@/lib/types";
import { payLinkWithAmount, paymentModes } from "./config";
import { getSettings } from "@/lib/queries";
import { createWaveCheckout } from "./wave";
import { createStripeCheckout } from "./stripe";
import { createOrangeMoneyCheckout } from "./orange-money";
import type { CheckoutResult, PaymentContext } from "./types";

/**
 * Initialise un paiement en ligne chez le prestataire et enregistre la session.
 * Ne marque JAMAIS un paiement comme réussi : seule la vérification webhook le fait.
 */
export async function startPayment(method: PaymentMethod, ctx: PaymentContext): Promise<CheckoutResult | null> {
  if (method === "livraison") return null;
  const { payments } = await getSettings();
  const mode = paymentModes(payments)[method];
  if (!mode) throw new Error("Ce moyen de paiement n'est pas encore activé.");

  // Lien marchand : aucune session en ligne, la confirmation se fait après vérification par l'équipe.
  if (mode === "lien") {
    const link = method === "wave" ? payments.wave_link : payments.orange_money_link;
    const url = payLinkWithAmount(link, ctx.amount);
    const { error } = await getServiceSupabase().rpc("mark_payment_link_mode", { p_payment_id: ctx.paymentId, p_url: url });
    if (error) throw new Error(error.message);
    return { providerReference: "", redirectUrl: null, extra: { mode: "lien", url } };
  }

  const result =
    method === "wave" ? await createWaveCheckout(ctx) : method === "carte" ? await createStripeCheckout(ctx) : await createOrangeMoneyCheckout(ctx);

  const sb = getServiceSupabase();
  await sb
    .from("payments")
    .update({
      status: "initie",
      provider_reference: result.providerReference,
      checkout_url: result.redirectUrl,
      raw: result.extra ? { checkout: result.extra } : null,
    })
    .eq("id", ctx.paymentId)
    .neq("status", "reussi");
  await sb.from("orders").update({ payment_status: "initie" }).eq("id", ctx.orderId).eq("payment_status", "en_attente");
  return result;
}
