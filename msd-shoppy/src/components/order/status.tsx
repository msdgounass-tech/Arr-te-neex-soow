import type { OrderStatus } from "@/lib/types";
import { Pill } from "@/components/ui/bits";
import { formatDate } from "@/lib/format";

export const STATUS: Record<OrderStatus, { label: string; tone: "neutral" | "success" | "warning" | "danger" | "orange" }> = {
  pending: { label: "En attente de confirmation", tone: "orange" },
  confirmed: { label: "Confirmée", tone: "neutral" },
  preparing: { label: "En préparation", tone: "neutral" },
  shipped: { label: "Expédiée", tone: "neutral" },
  delivered: { label: "Livrée", tone: "success" },
  completed: { label: "Terminée", tone: "success" },
  refused: { label: "Refusée", tone: "danger" },
  cancelled: { label: "Annulée", tone: "danger" },
};

export function StatusPill({ status }: { status: OrderStatus }) {
  return <Pill tone={STATUS[status].tone}>{STATUS[status].label}</Pill>;
}

const FLOW: OrderStatus[] = ["pending", "confirmed", "preparing", "shipped", "delivered", "completed"];

/** Frise des étapes : l'historique réel (order_events) est affiché avec sa date. */
export function OrderTimeline({ status, events }: { status: OrderStatus; events: { status: OrderStatus; created_at: string; note: string | null }[] }) {
  if (status === "refused" || status === "cancelled") {
    const ev = events.find((e) => e.status === status);
    return <div className="rounded-2xl bg-danger-soft p-4 text-sm text-danger"><b>{STATUS[status].label}</b>{ev?.note ? ` — ${ev.note}` : ""}</div>;
  }
  const reached = new Map(events.map((e) => [e.status, e.created_at]));
  const idx = FLOW.indexOf(status);
  return (
    <ol className="space-y-0">
      {FLOW.map((s, i) => {
        const done = i <= idx;
        return (
          <li key={s} className="relative flex gap-3 pb-4 last:pb-0">
            {i < FLOW.length - 1 && <span aria-hidden="true" className={`absolute left-[9px] top-5 h-full w-0.5 ${i < idx ? "bg-success" : "bg-line"}`} />}
            <span aria-hidden="true" className={`relative z-10 mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 ${done ? "border-success bg-success" : "border-line bg-white"}`} />
            <div className="text-sm"><p className={done ? "font-semibold" : "text-slate"}>{STATUS[s].label}</p>
              {reached.get(s) && <p className="text-xs text-slate">{formatDate(reached.get(s)!, true)}</p>}</div>
          </li>
        );
      })}
    </ol>
  );
}
