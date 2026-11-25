import Link from "next/link";
import { Icon } from "./Icon";

export function EmptyState({ icon = "search", title, text, action }:
  { icon?: string; title: string; text?: string; action?: { href: string; label: string } }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-line px-6 py-12 text-center">
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-orange-soft text-orange-text"><Icon name={icon} size={26} /></span>
      <h2 className="text-lg font-semibold">{title}</h2>
      {text ? <p className="mt-1 max-w-sm text-sm text-slate">{text}</p> : null}
      {action ? <Link href={action.href} className="btn btn-primary press mt-5">{action.label}</Link> : null}
    </div>
  );
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-orange" aria-label={`${value} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name="star" size={size} filled={i <= Math.round(value)} className={i <= Math.round(value) ? "" : "text-line"} />
      ))}
    </span>
  );
}

export function Pill({ tone = "neutral", children }: { tone?: "neutral" | "success" | "warning" | "danger" | "orange"; children: React.ReactNode }) {
  const cls = {
    neutral: "bg-mist text-ink", success: "bg-success-soft text-success", warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger", orange: "bg-orange-soft text-orange-text",
  }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>{children}</span>;
}

export function PageTitle({ title, subtitle, back, action }: { title: string; subtitle?: string; back?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="min-w-0">
        {back ? (
          <Link href={back} className="press mb-2 inline-flex items-center gap-1 text-sm font-medium text-slate hover:text-ink">
            <Icon name="arrow-left" size={16} /> Retour
          </Link>
        ) : null}
        <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-slate">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function SetupNotice() {
  return (
    <div className="container-page mt-4">
      <p className="rounded-2xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
        Base de données non configurée : renseignez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY (voir msd-shoppy/README.md).
      </p>
    </div>
  );
}
