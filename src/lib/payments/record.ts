import "server-only";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { notifyOrder } from "@/lib/notifications";
import type { PaymentStatus } from "@/lib/types";

/** Applique un résultat de paiement VÉRIFIÉ (appelé uniquement depuis les webhooks authentifiés). */
export async function recordPaymentResult(opts: {
  paymentId: string;
  provider: "wave" | "orange_money" | "carte";
  status: PaymentStatus;
  reference?: string | null;
  amount?: number | null;
  raw: unknown;
}) {
  const sb = getServiceSupabase();
  const { data: before } = await sb.from("payments").select("id, order_id, status, provider").eq("id", opts.paymentId).maybeSingle();
  if (!before) throw new Error("Paiement inconnu");
  if (before.provider !== opts.provider) throw new Error("Prestataire incohérent");
  if (before.status === "reussi") return { alreadyPaid: true };

  const { error } = await sb.rpc("record_payment_result", {
    p_payment_id: opts.paymentId,
    p_status: opts.status,
    p_reference: opts.reference ?? null,
    p_amount: opts.amount ?? null,
    p_raw: opts.raw as object,
  });
  if (error) throw new Error(error.message);
  if (opts.status === "reussi") await notifyOrder(before.order_id, "payment_received");
  return { alreadyPaid: false };
}
