"use client";
import { useTransition } from "react";
import { toast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/errors";

/** Bouton d'action d'administration avec confirmation facultative et retour visuel. */
export function AdminButton({ action, label, confirmText, tone = "secondary" }:
  { action: () => Promise<ActionResult>; label: string; confirmText?: string; tone?: "primary" | "secondary" | "danger" }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} className={`btn btn-sm press ${tone === "primary" ? "btn-primary" : tone === "danger" ? "btn-danger" : "btn-secondary"}`}
      onClick={() => { if (confirmText && !confirm(confirmText)) return; start(async () => { const r = await action(); toast(r.ok ? r.message ?? "Fait" : r.error, r.ok ? "success" : "error"); }); }}>
      {pending ? "…" : label}
    </button>
  );
}
