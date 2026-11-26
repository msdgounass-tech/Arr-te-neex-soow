import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

/** Chiffre affiché directement (pas de compteur animé : c'est une donnée lue et utilisée). */
export function StatCard({ label, value, icon, href, hint, tone = "neutral" }:
  { label: string; value: string | number; icon: string; href?: string; hint?: string; tone?: "neutral" | "orange" | "success" }) {
  const body = (
    <>
      <span className={`grid h-9 w-9 place-items-center rounded-xl ${tone === "orange" ? "bg-orange-soft text-orange-text" : tone === "success" ? "bg-success-soft text-success" : "bg-mist text-ink"}`}><Icon name={icon} size={18} /></span>
      <span className="mt-3 block font-display text-2xl font-bold">{value}</span>
      <span className="text-sm text-slate">{label}</span>
      {hint && <span className="mt-1 block text-xs text-slate">{hint}</span>}
    </>
  );
  return href ? <Link href={href} className="card press block p-4 hover:border-[#cfd3db]">{body}</Link> : <div className="card p-4">{body}</div>;
}
