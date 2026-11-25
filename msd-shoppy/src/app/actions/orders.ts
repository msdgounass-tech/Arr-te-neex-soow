"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { friendlyError, type ActionResult } from "@/lib/errors";
import { isValidSenegalPhone } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

const itemSchema = z.object({ product_id: z.uuid(), variant_id: z.uuid().nullable(), quantity: z.number().int().min(1).max(99) });
const deliverySchema = z.object({
  recipient_name: z.string().trim().min(2, "Indiquez le nom de la personne qui reçoit la commande.").max(80),
  phone: z.string().trim().refine(isValidSenegalPhone, "Indiquez un numéro sénégalais valide (ex. 77 123 45 67)."),
  region: z.string().trim().min(2, "Choisissez la région."),
  city: z.string().trim().min(2, "Indiquez la ville ou le quartier.").max(80),
  address_details: z.string().trim().max(300).default(""),
  note: z.string().trim().max(500).default(""),
  payment_method: z.enum(["cash_on_delivery", "wave_direct", "orange_money_direct"]),
  zones: z.record(z.string(), z.string()).default({}),
  save_address: z.boolean().default(false),
});

export async function placeOrdersAction(items: unknown, delivery: unknown): Promise<ActionResult<{ id: string; number: string; shop: string }[]>> {
  const it = z.array(itemSchema).min(1).max(50).safeParse(items);
  if (!it.success) return { ok: false, error: "Votre panier contient un article invalide. Actualisez la page." };
  const d = deliverySchema.safeParse(delivery);
  if (!d.success) {
    const fields: Record<string, string> = {};
    for (const issue of d.error.issues) fields[String(issue.path[0])] ??= issue.message;
    return { ok: false, error: "Vérifiez les informations de livraison.", fields };
  }
  const sb = await supabaseServer();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return { ok: false, error: "Connectez-vous pour commander." };
  const { save_address, ...payload } = d.data;
  const { data, error } = await sb.rpc("place_orders", { p_items: it.data, p_delivery: payload });
  if (error) return { ok: false, error: friendlyError(error) };
  if (save_address) {
    const { count } = await sb.from("addresses").select("id", { count: "exact", head: true });
    await sb.from("addresses").insert({ user_id: auth.user.id, recipient_name: payload.recipient_name, phone: payload.phone, region: payload.region,
      city: payload.city, details: payload.address_details, is_default: !count });
  }
  revalidatePath("/compte/commandes");
  return { ok: true, data: data as { id: string; number: string; shop: string }[] };
}

export async function setOrderStatusAction(orderId: string, status: OrderStatus, note?: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(orderId).success) return { ok: false, error: "Commande introuvable." };
  const sb = await supabaseServer();
  const { error } = await sb.rpc("set_order_status", { p_order: orderId, p_status: status, p_note: note?.trim() || null });
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath(`/vendeur/commandes/${orderId}`); revalidatePath("/vendeur/commandes"); revalidatePath(`/compte/commandes/${orderId}`); revalidatePath("/vendeur");
  return { ok: true };
}

export async function submitReviewAction(orderId: string, rating: number, comment: string): Promise<ActionResult> {
  const sb = await supabaseServer();
  const { error } = await sb.rpc("submit_review", { p_order: orderId, p_rating: rating, p_comment: comment.slice(0, 1000) });
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath(`/compte/commandes/${orderId}`);
  return { ok: true };
}
