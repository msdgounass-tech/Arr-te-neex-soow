"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { friendlyError, type ActionResult } from "@/lib/errors";

/** Actions d'administration : chaque fonction SQL vérifie elle-même le rôle is_platform_admin. */
async function run(fn: string, args: Record<string, unknown>, paths: string[], message: string): Promise<ActionResult> {
  const sb = await supabaseServer();
  const { error } = await sb.rpc(fn, args);
  if (error) return { ok: false, error: friendlyError(error) };
  paths.forEach((p) => revalidatePath(p));
  return { ok: true, message };
}

export const reviewPaymentAction = async (id: string, approve: boolean, days: number) =>
  run("admin_review_subscription_payment", { p_payment: id, p_approve: approve, p_days: days }, ["/admin", "/admin/paiements"], approve ? "Paiement validé, abonnement activé." : "Paiement refusé.");
export const setSubscriptionAction = async (shopId: string, action: "suspend" | "activate" | "extend_trial", days = 30) =>
  run("admin_set_subscription", { p_shop: shopId, p_action: action, p_days: days }, ["/admin", "/admin/boutiques"],
    action === "suspend" ? "Boutique suspendue." : action === "activate" ? `Abonnement activé ${days} jours.` : `Essai prolongé de ${days} jours.`);
export const setVerifiedAction = async (shopId: string, verified: boolean) =>
  run("admin_set_shop_verified", { p_shop: shopId, p_verified: verified }, ["/admin/boutiques"], verified ? "Badge « Boutique vérifiée » attribué." : "Badge retiré.");
export const setProductStatusAdminAction = async (productId: string, status: "hidden" | "published") =>
  run("admin_set_product_status", { p_product: productId, p_status: status }, ["/admin/produits"], status === "hidden" ? "Produit masqué." : "Produit republié.");
export const setTicketStatusAction = async (ticketId: string, status: "open" | "closed") =>
  run("admin_set_ticket_status", { p_ticket: ticketId, p_status: status }, ["/admin", "/admin/signalements"], status === "closed" ? "Signalement clos." : "Signalement rouvert.");
