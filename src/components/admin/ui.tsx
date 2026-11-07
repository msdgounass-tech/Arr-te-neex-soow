import clsx from "clsx";
import type { OrderStatus, PaymentStatus } from "@/lib/types";
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/format";

export function PageTitle({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="eyebrow">Administration</p>
        <h1 className="display mt-3 text-4xl md:text-5xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-mist">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-3">{children}</div>}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx("border border-white/[0.1] bg-ink-2 p-6", className)}>{children}</div>;
}

const STATUS_COLOR: Record<OrderStatus, string> = {
  en_attente: "border-accent/40 text-accent",
  confirmee: "border-sky-400/40 text-sky-300",
  en_preparation: "border-violet-400/40 text-violet-300",
  expediee: "border-amber-300/40 text-amber-200",
  livree: "border-success/50 text-success",
  annulee: "border-danger/50 text-danger",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={clsx("inline-block whitespace-nowrap border px-2 py-0.5 text-[0.78rem] uppercase tracking-[0.14em]", STATUS_COLOR[status])}>{ORDER_STATUS_LABEL[status]}</span>;
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <span className={clsx("text-[0.74rem] uppercase tracking-[0.12em]", status === "reussi" ? "text-success" : status === "echoue" || status === "annule" ? "text-danger" : "text-mist")}>{PAYMENT_STATUS_LABEL[status]}</span>;
}

export const th = "py-3 pr-4 text-left text-[0.78rem] font-normal uppercase tracking-[0.2em] text-mist";
export const td = "py-3 pr-4 align-middle";
