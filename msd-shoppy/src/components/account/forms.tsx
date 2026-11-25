"use client";
import { useActionState, useEffect } from "react";
import type { ActionResult } from "@/lib/errors";
import { toast } from "@/components/ui/toast";

/** Formulaire relié à une action serveur, avec message de résultat et toast. */
export function ActionForm({ action, children, className = "space-y-4", submitLabel, danger = false, onDone }:
  { action: (s: ActionResult | null, f: FormData) => Promise<ActionResult>; children: React.ReactNode; className?: string; submitLabel: string; danger?: boolean; onDone?: () => void }) {
  const [state, formAction, pending] = useActionState(action, null);
  useEffect(() => { if (state?.ok) { if (state.message) toast(state.message); onDone?.(); } }, [state, onDone]);
  return (
    <form action={formAction} className={className} noValidate>
      {children}
      {state && !state.ok && <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}
      <button type="submit" disabled={pending} className={`btn ${danger ? "btn-danger" : "btn-primary"} press`}>{pending ? "Patientez…" : submitLabel}</button>
    </form>
  );
}
