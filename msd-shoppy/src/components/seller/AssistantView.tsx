"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { GUIDES } from "@/lib/assistant";
import { setAssistantStepAction } from "@/app/actions/seller";
import { Sheet } from "@/components/ui/Sheet";
import { DemoPlayer } from "./DemoPlayer";
import { Icon } from "@/components/ui/Icon";
import { Pill } from "@/components/ui/bits";

export function AssistantView({ status }: { status: Record<string, { done: boolean; dismissed: boolean }> }) {
  const params = useSearchParams();
  const router = useRouter();
  const [pending, start] = useTransition();
  const demoKey = params.get("demo");
  const demo = GUIDES.find((g) => g.key === demoKey) ?? null;
  const close = () => router.replace("/vendeur/assistant", { scroll: false });
  return (
    <>
      <ol className="space-y-4">
        {GUIDES.map((g, n) => {
          const st = status[g.key];
          return (
            <li key={g.key} id={g.key} className="card scroll-mt-24 p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><p className="text-xs font-semibold text-slate">Étape {n + 1} · environ {g.minutes} min</p><h2 className="text-lg font-semibold">{g.title}</h2><p className="text-sm text-slate">{g.summary}</p></div>
                {st?.done ? <Pill tone="success"><Icon name="check" size={12} /> Fait</Pill> : st?.dismissed ? <Pill>Ignorée</Pill> : <Pill tone="orange">À faire</Pill>}
              </div>
              <details className="group mt-3">
                <summary className="press inline-flex cursor-pointer list-none items-center gap-1 text-sm font-semibold text-orange-text">Comment faire ?<Icon name="chevron-down" size={16} className="transition-transform duration-200 group-open:rotate-180" /></summary>
                <ol className="mt-3 space-y-3">{g.steps.map((s, k) => (
                  <li key={s.title} className="flex gap-3 text-sm"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-orange-soft text-xs font-bold text-orange-text">{k + 1}</span>
                    <span><b>{s.title}.</b> <span className="text-slate">{s.text}</span></span></li>))}</ol>
                {g.tips.length > 0 && <ul className="mt-3 space-y-1 rounded-xl bg-mist p-3 text-sm">{g.tips.map((t) => <li key={t} className="flex gap-2"><Icon name="bulb" size={16} className="mt-0.5 shrink-0 text-orange-text" />{t}</li>)}</ul>}
              </details>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/vendeur/assistant?demo=${g.key}`} scroll={false} className="btn btn-secondary btn-sm press"><Icon name="play" size={14} /> Voir la démonstration</Link>
                {g.action && <Link href={g.action.href} className="btn btn-primary btn-sm press">{g.action.label}</Link>}
                {!st?.done && (st?.dismissed
                  ? <button type="button" disabled={pending} className="btn btn-ghost btn-sm press" onClick={() => start(async () => { await setAssistantStepAction(g.key, "reset"); })}>Reprendre</button>
                  : <button type="button" disabled={pending} className="btn btn-ghost btn-sm press" onClick={() => start(async () => { await setAssistantStepAction(g.key, "dismissed"); })}>Ignorer pour l'instant</button>)}
              </div>
            </li>
          );
        })}
      </ol>
      <Sheet open={Boolean(demo)} onClose={close} title={demo ? `Démonstration : ${demo.title}` : ""}>
        {demo && <DemoPlayer guide={demo} onClose={close} />}
      </Sheet>
    </>
  );
}
