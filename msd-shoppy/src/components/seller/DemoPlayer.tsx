"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { LazyMotionScope } from "@/components/motion/LazyMotionScope";
import { stepVariants, stepTransition } from "@/lib/motion/presets";
import type { Guide } from "@/lib/assistant";
import { Icon } from "@/components/ui/Icon";

/**
 * Démonstration pas à pas : maquette d'écran, élément mis en évidence, légende.
 * Changement d'étape interruptible (Motion), lecture automatique facultative et désactivée par défaut.
 */
export function DemoPlayer({ guide, onClose }: { guide: Guide; onClose: () => void }) {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const go = (n: number) => { setDir(n > i ? 1 : -1); setI(n); };
  const [auto, setAuto] = useState(false);
  const step = guide.steps[i];
  const last = i === guide.steps.length - 1;
  useEffect(() => {
    if (!auto) return;
    if (last) { setAuto(false); return; }
    const t = window.setTimeout(() => { setDir(1); setI((n) => n + 1); }, 4000);
    return () => window.clearTimeout(t);
  }, [auto, i, last]);

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl bg-mist p-4" aria-live="polite">
        <LazyMotionScope>
          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            <m.div key={i} custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={stepTransition} className="space-y-3">
              <div className="mx-auto max-w-xs rounded-2xl border border-line bg-white p-4 shadow-sm" aria-hidden="true">
                <div className="mb-3 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-line" /><span className="h-2 w-16 rounded-full bg-line" /></div>
                <p className="text-xs font-medium text-slate">{step.demo.screen}</p>
                <p className="mt-1 rounded-xl border-2 border-orange-strong bg-orange-soft px-3 py-2 text-sm font-semibold text-ink">{step.demo.highlight}</p>
                <div className="mt-3 space-y-1.5"><span className="block h-2 w-full rounded-full bg-mist" /><span className="block h-2 w-2/3 rounded-full bg-mist" /></div>
              </div>
              <p className="text-center text-xs text-slate">{step.demo.caption}</p>
            </m.div>
          </AnimatePresence>
        </LazyMotionScope>
      </div>
      <div>
        <p className="text-xs font-semibold text-orange-text">Étape {i + 1} sur {guide.steps.length}</p>
        <h3 className="mt-1 font-semibold">{step.title}</h3>
        <p className="mt-1 text-sm text-slate">{step.text}</p>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" className="btn btn-secondary btn-sm press" disabled={i === 0} onClick={() => { setAuto(false); go(i - 1); }}><Icon name="chevron-left" size={16} />Précédent</button>
        <button type="button" className="btn btn-ghost btn-sm press" aria-pressed={auto} onClick={() => setAuto(!auto)}>{auto ? "Pause" : <><Icon name="play" size={14} />Lecture auto</>}</button>
        {last ? <button type="button" className="btn btn-primary btn-sm press ml-auto" onClick={onClose}>Terminer</button>
          : <button type="button" className="btn btn-primary btn-sm press ml-auto" onClick={() => { setAuto(false); go(i + 1); }}>Suivant<Icon name="chevron-right" size={16} /></button>}
      </div>
    </div>
  );
}
