import "server-only";
import { getPublicSupabase } from "@/lib/supabase/server";
import type { Order } from "@/lib/types";

export const ORDER_SELECT = "*, order_items(*), order_status_history(id, status, note, created_at), deliveries(status, carrier, tracking_number, shipped_at, delivered_at)";

type PublicOrder = Order & { payment: { id: string; status: string; checkout_url: string | null; mode: string | null; qr_code: string | null } | null };

/** Lecture d'une commande via son numéro + jeton secret (lien reçu par le client). */
export async function getOrderByToken(orderNumber: string, token: string) {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return null;
  const sb = getPublicSupabase();
  if (!sb) return null;
  const { data, error } = await sb.rpc("get_order_public", { p_number: orderNumber, p_token: token });
  if (error || !data) return null;
  const order = data as PublicOrder;
  const payLink = order.payment?.mode === "lien" && order.payment.checkout_url ? order.payment.checkout_url : null;
  return { order: order as Order, qrCode: order.payment?.qr_code ?? null, payLink };
}
