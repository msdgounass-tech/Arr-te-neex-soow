"use client";
import { useActionState } from "react";
import { updateDelivery, updateOrderStatus, type ActionResult } from "@/app/admin/actions";
import { ORDER_STATUS_LABEL } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

export function StatusForm({ id, status }: { id: string; status: OrderStatus }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(updateOrderStatus, {});
  const locked = status === "annulee";
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <select name="status" defaultValue={status} disabled={locked} className="field-box">
        {(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map((s) => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}
      </select>
      <label className="flex items-center gap-2 text-xs text-ivory/80">
        <input type="checkbox" name="notify" defaultChecked className="accent-[#C6A15B]" /> Notifier le client (WhatsApp / e-mail)
      </label>
      {state.error && <p className="text-xs text-danger">{state.error}</p>}
      {state.message && <p className="text-xs text-gold">{state.message}</p>}
      <button disabled={pending || locked} className="btn btn-gold min-h-10 w-full">{pending ? "…" : "Mettre à jour le statut"}</button>
      <p className="text-[0.65rem] leading-relaxed text-mist">L&apos;annulation remet automatiquement les articles en stock. Une commande annulée est définitive.</p>
    </form>
  );
}

export function DeliveryForm({ orderId, d }: { orderId: string; d: { carrier: string | null; tracking_number: string | null; scheduled_for: string | null; notes: string | null } | null }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(updateDelivery, {});
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="order_id" value={orderId} />
      <label className="block"><span className="label">Livreur / transporteur</span><input name="carrier" defaultValue={d?.carrier || ""} className="field-box mt-1" /></label>
      <label className="block"><span className="label">N° de suivi</span><input name="tracking_number" defaultValue={d?.tracking_number || ""} className="field-box mt-1" /></label>
      <label className="block"><span className="label">Date prévue</span><input type="date" name="scheduled_for" defaultValue={d?.scheduled_for || ""} className="field-box mt-1" /></label>
      <label className="block"><span className="label">Notes internes</span><textarea name="notes" rows={2} defaultValue={d?.notes || ""} className="field-box mt-1" /></label>
      {state.error && <p className="text-xs text-danger">{state.error}</p>}
      {state.message && <p className="text-xs text-gold">{state.message}</p>}
      <button disabled={pending} className="btn btn-ghost-gold min-h-10 w-full">{pending ? "…" : "Enregistrer la livraison"}</button>
    </form>
  );
}
