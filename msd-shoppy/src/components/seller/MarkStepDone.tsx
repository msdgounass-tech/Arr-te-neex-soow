"use client";
import { useEffect } from "react";
import { setAssistantStepAction } from "@/app/actions/seller";

/** Marque une étape de l'assistant comme faite lorsque le vendeur visite la page correspondante. */
export function MarkStepDone({ stepKey }: { stepKey: string }) {
  useEffect(() => {
    const k = `msd-step:${stepKey}`;
    try { if (localStorage.getItem(k)) return; localStorage.setItem(k, "1"); } catch { /* ignore */ }
    void setAssistantStepAction(stepKey, "done");
  }, [stepKey]);
  return null;
}
