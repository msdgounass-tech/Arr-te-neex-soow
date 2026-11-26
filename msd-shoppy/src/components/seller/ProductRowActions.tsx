"use client";
import { useTransition } from "react";
import { setProductStatusAction, deleteProductAction } from "@/app/actions/seller";
import { toast } from "@/components/ui/toast";
import type { ProductStatus } from "@/lib/types";

export function ProductRowActions({ id, status, canManage }: { id: string; status: ProductStatus; canManage: boolean }) {
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) => start(async () => {
    const r = await fn(); toast(r.ok ? r.message ?? "Enregistré" : r.error ?? "Erreur", r.ok ? "success" : "error");
  });
  if (!canManage) return null;
  return (
    <div className="flex flex-wrap gap-2" aria-busy={pending}>
      {status === "published"
        ? <button type="button" disabled={pending} className="btn btn-secondary btn-sm press" onClick={() => run(() => setProductStatusAction(id, "hidden"))}>Masquer</button>
        : <button type="button" disabled={pending} className="btn btn-secondary btn-sm press" onClick={() => run(() => setProductStatusAction(id, "published"))}>Publier</button>}
      <button type="button" disabled={pending} className="btn btn-ghost btn-sm press text-danger"
        onClick={() => { if (confirm("Supprimer définitivement ce produit ? Les commandes passées restent consultables.")) run(() => deleteProductAction(id)); }}>Supprimer</button>
    </div>
  );
}
