import clsx from "clsx";
import { quickSetStatus } from "@/app/admin/actions";
import type { OrderStatus } from "@/lib/types";
import { ConfirmSubmit } from "./ConfirmSubmit";

/** Étape suivante proposée pour chaque statut. */
export const NEXT_STEP: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  en_attente: { status: "confirmee", label: "Confirmer la commande" },
  confirmee: { status: "en_preparation", label: "Passer en préparation" },
  en_preparation: { status: "expediee", label: "Marquer comme expédiée" },
  expediee: { status: "livree", label: "Marquer comme livrée" },
};

/** Boutons d'action directe : étape suivante + annulation (avec confirmation). */
export function OrderQuickActions({ id, status, size = "md", withCancel = true }: { id: string; status: OrderStatus; size?: "sm" | "md"; withCancel?: boolean }) {
  const next = NEXT_STEP[status];
  if (!next && status !== "annulee" && status !== "livree") return null;
  return (
    <div className={clsx("flex flex-wrap gap-2", size === "md" && "gap-3")}>
      {next && (
        <form action={quickSetStatus}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value={next.status} />
          <button className={clsx("btn btn-gold", size === "sm" ? "min-h-11 px-4 text-[0.7rem]" : "min-h-12 px-6")}>{next.label}</button>
        </form>
      )}
      {withCancel && next && (
        <form action={quickSetStatus}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value="annulee" />
          <ConfirmSubmit
            message="Annuler définitivement cette commande ? Le stock sera remis en vente."
            className={clsx("btn border border-danger/60 text-danger", size === "sm" ? "min-h-11 px-4 text-[0.7rem]" : "min-h-12 px-6")}
          >
            Annuler
          </ConfirmSubmit>
        </form>
      )}
    </div>
  );
}
