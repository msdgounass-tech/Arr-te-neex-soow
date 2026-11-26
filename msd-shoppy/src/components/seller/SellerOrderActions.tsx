"use client";
import { useState, useTransition } from "react";
import { setOrderStatusAction } from "@/app/actions/orders";
import { toast } from "@/components/ui/toast";
import { Sheet } from "@/components/ui/Sheet";
import type { OrderStatus } from "@/lib/types";

const NEXT: Partial<Record<OrderStatus, { to: OrderStatus; label: string; done: string }>> = {
  pending: { to: "confirmed", label: "Confirmer la commande", done: "Commande confirmée" },
  confirmed: { to: "preparing", label: "Commencer la préparation", done: "Commande en préparation" },
  preparing: { to: "shipped", label: "Marquer comme expédiée", done: "Commande expédiée" },
  shipped: { to: "delivered", label: "Marquer comme livrée", done: "Commande livrée" },
  delivered: { to: "completed", label: "Terminer la commande", done: "Commande terminée" },
};

export function SellerOrderActions({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [pending, start] = useTransition();
  const [refuse, setRefuse] = useState<null | "refused" | "cancelled">(null);
  const [reason, setReason] = useState("");
  const next = NEXT[status];
  const run = (to: OrderStatus, msg: string, note?: string) => start(async () => {
    const r = await setOrderStatusAction(orderId, to, note);
    toast(r.ok ? msg : r.error, r.ok ? "success" : "error");
    if (r.ok) setRefuse(null);
  });
  return (
    <div className="space-y-2">
      {next && <button type="button" disabled={pending} className="btn btn-primary press w-full" onClick={() => run(next.to, next.done)}>{next.label}</button>}
      {status === "delivered" && <p className="text-xs text-slate">Le client peut aussi confirmer la réception lui-même. Une commande terminée compte dans vos ventes et ouvre la possibilité d'un avis.</p>}
      {status === "pending" && <button type="button" disabled={pending} className="btn btn-secondary press w-full" onClick={() => setRefuse("refused")}>Refuser</button>}
      {(status === "confirmed" || status === "preparing") && <button type="button" disabled={pending} className="btn btn-ghost press w-full text-danger" onClick={() => setRefuse("cancelled")}>Annuler la commande</button>}
      <Sheet open={refuse !== null} onClose={() => setRefuse(null)} title={refuse === "refused" ? "Refuser la commande" : "Annuler la commande"}
        footer={<button type="button" disabled={pending || reason.trim().length < 3} className="btn btn-danger press w-full" onClick={() => run(refuse!, refuse === "refused" ? "Commande refusée" : "Commande annulée", reason)}>Confirmer</button>}>
        <label className="label" htmlFor="reason">Motif communiqué au client</label>
        <textarea id="reason" data-autofocus rows={3} className="field" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex. Produit en rupture, nous vous proposons…" />
        <p className="hint">Le stock réservé par la commande est automatiquement remis en vente.</p>
      </Sheet>
    </div>
  );
}
