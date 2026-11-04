import clsx from "clsx";
import { formatDate, ORDER_STATUS_FLOW, ORDER_STATUS_LABEL } from "@/lib/format";
import type { Order } from "@/lib/types";

export function OrderTimeline({ order }: { order: Order }) {
  if (order.status === "annulee") {
    return <p className="border border-danger/40 px-4 py-3 text-sm text-danger">Cette commande a été annulée.</p>;
  }
  const idx = ORDER_STATUS_FLOW.indexOf(order.status);
  const history = order.order_status_history || [];
  return (
    <ol className="grid grid-cols-5 gap-2">
      {ORDER_STATUS_FLOW.map((s, i) => {
        const h = [...history].reverse().find((x) => x.status === s);
        return (
          <li key={s} className="flex flex-col items-center text-center">
            <span className={clsx("relative flex h-3 w-3 items-center justify-center rounded-full", i <= idx ? "bg-gold" : "bg-white/15")}>
              {i === idx && <span className="absolute h-6 w-6 animate-ping rounded-full bg-gold/30" />}
            </span>
            <span className={clsx("mt-3 text-[0.68rem] uppercase tracking-[0.16em] sm:text-[0.78rem]", i <= idx ? "text-ivory" : "text-mist")}>{ORDER_STATUS_LABEL[s]}</span>
            {h && <span className="mt-1 hidden text-[0.78rem] text-mist sm:block">{formatDate(h.created_at)}</span>}
          </li>
        );
      })}
    </ol>
  );
}
