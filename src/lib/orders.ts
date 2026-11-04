import "server-only";
import { getServiceSupabase } from "@/lib/supabase/admin";
import type { Order } from "@/lib/types";

export const ORDER_SELECT = "*, order_items(*), order_status_history(id, status, note, created_at), deliveries(status, carrier, tracking_number, shipped_at, delivered_at)";

/** Lecture d'une commande invitée via son numéro + jeton secret (lien reçu par le client). */
export async function getOrderByToken(orderNumber: string, token: string) {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return null;
  const sb = getServiceSupabase();
  const { data } = await sb.from("orders").select(ORDER_SELECT).eq("order_number", orderNumber).eq("access_token", token).maybeSingle();
  if (!data) return null;
  const order = data as Order & { deliveries: Order["deliveries"] | Order["deliveries"][] };
  if (Array.isArray(order.deliveries)) order.deliveries = order.deliveries[0] ?? null;
  const { data: pay } = await sb.from("payments").select("raw, status, checkout_url").eq("order_id", order.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const raw = pay?.raw as { checkout?: { qrCode?: string }; mode?: string } | null;
  const qrCode = raw?.checkout?.qrCode ?? null;
  const payLink = raw?.mode === "lien" && pay?.checkout_url ? pay.checkout_url : null;
  return { order: order as Order, qrCode, payLink };
}
