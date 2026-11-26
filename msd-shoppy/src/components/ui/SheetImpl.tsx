"use client";
import { useEffect, useId, useRef } from "react";
import { AnimatePresence, m, useDragControls, useReducedMotion } from "motion/react";
import { LazyMotionScope } from "@/components/motion/LazyMotionScope";
import { backdropMotion, backdropFadeMotion, sheetMotion, sheetFadeMotion, drawerMotion, DISMISS_DISTANCE, DISMISS_VELOCITY } from "@/lib/motion/presets";
import { Icon } from "./Icon";

/**
 * Feuille du bas sur mobile (glisser vers le bas pour fermer), tiroir latéral sur ordinateur.
 * Focus piégé, fermeture par Échap, défilement de la page bloqué pendant l'ouverture.
 */
export function SheetImpl({ open, onClose, title, children, footer, side = "auto" }:
  { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode; side?: "auto" | "bottom" }) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const controls = useDragControls();
  const reduce = useReducedMotion();
  // Pendant l'animation de sortie, on garde le dernier contenu affiché (pas de feuille vide qui glisse).
  const last = useRef({ title, children, footer });
  if (open) last.current = { title, children, footer };
  const isDesktop = typeof window !== "undefined" && side === "auto" && window.matchMedia("(min-width: 768px)").matches;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>('a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>("[data-autofocus],button")?.focus());
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; previous?.focus?.(); };
  }, [open, onClose]);

  return (
    <LazyMotionScope>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50" key="sheet-root">
            <m.div {...(reduce ? backdropFadeMotion : backdropMotion)} className="absolute inset-0 bg-ink/40" onClick={onClose} />
            <m.div ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId}
              {...(reduce ? sheetFadeMotion : isDesktop ? drawerMotion : sheetMotion)}
              drag={isDesktop || reduce ? false : "y"} dragListener={false} dragControls={controls}
              dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0.04, bottom: 1 }}
              onDragEnd={(_, info) => { if (info.velocity.y > DISMISS_VELOCITY || info.offset.y > DISMISS_DISTANCE) onClose(); }}
              className={isDesktop
                ? "absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl"
                : "absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-3xl bg-white shadow-2xl"}>
              {/* Le glisser part uniquement de la poignée et de l'en-tête : le contenu reste défilable au doigt. */}
              <div onPointerDown={(e) => { if (!isDesktop) controls.start(e); }} className={isDesktop ? "" : "touch-none"}>
              {!isDesktop && <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-line" aria-hidden="true" />}
              <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-3 md:pt-5">
                <h2 id={titleId} className="text-lg font-semibold">{last.current.title}</h2>
                <button type="button" onClick={onClose} className="press -mr-2 rounded-full p-2 hover:bg-mist" aria-label="Fermer">
                  <Icon name="x" />
                </button>
              </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">{last.current.children}</div>
              {last.current.footer ? <div className="safe-bottom border-t border-line px-5 py-3">{last.current.footer}</div> : null}
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </LazyMotionScope>
  );
}
