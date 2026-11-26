"use client";
import Link from "next/link";
import { useTransition } from "react";
import { setAssistantStepAction } from "@/app/actions/seller";
import { Icon } from "@/components/ui/Icon";

interface Step { key: string; title: string; summary: string; done: boolean; dismissed: boolean; action?: { href: string; label: string } }

export function Checklist({ steps, done, total, compact = false }: { steps: Step[]; done: number; total: number; compact?: boolean }) {
  const [pending, start] = useTransition();
  const list = compact ? steps.filter((s) => !s.done && !s.dismissed).slice(0, 3) : steps;
  return (
    <section className="card p-5" aria-labelledby="checklist-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="checklist-title" className="font-semibold">Progression de la boutique</h2>
        <span className="text-sm font-semibold text-orange-text">{done} / {total}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-mist" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label="Étapes terminées">
        <div className="h-full origin-left rounded-full bg-orange-strong" style={{ transform: `scaleX(${done / total})`, transition: "transform var(--dur-reveal) var(--ease-out)" }} />
      </div>
      <ul className="mt-4 space-y-2" aria-busy={pending}>
        {list.map((s) => (
          <li key={s.key} className={`flex items-start gap-3 rounded-xl p-2 ${s.dismissed ? "opacity-60" : ""}`}>
            <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${s.done ? "bg-success text-white" : "border-2 border-line"}`}>{s.done && <Icon name="check" size={14} strokeWidth={3} />}</span>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium ${s.done ? "text-slate line-through" : ""}`}>{s.title}</p>
              {!s.done && <p className="text-xs text-slate">{s.summary}</p>}
              {!s.done && (
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold">
                  <Link href={`/vendeur/assistant#${s.key}`} className="link">Comment faire ?</Link>
                  <Link href={`/vendeur/assistant?demo=${s.key}`} className="link">Voir la démonstration</Link>
                  {s.dismissed
                    ? <button type="button" className="text-slate hover:text-ink" onClick={() => start(async () => { await setAssistantStepAction(s.key, "reset"); })}>Reprendre</button>
                    : <button type="button" className="text-slate hover:text-ink" onClick={() => start(async () => { await setAssistantStepAction(s.key, "dismissed"); })}>Ignorer pour l'instant</button>}
                  {!["create_shop", "complete_profile", "choose_domain", "first_products", "improve_presentation"].includes(s.key) &&
                    <button type="button" className="text-slate hover:text-ink" onClick={() => start(async () => { await setAssistantStepAction(s.key, "done"); })}>Marquer comme fait</button>}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
      {compact && <Link href="/vendeur/assistant" className="link mt-3 inline-block text-sm">Ouvrir l'assistant</Link>}
    </section>
  );
}
