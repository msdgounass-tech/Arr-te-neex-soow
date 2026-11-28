"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { friendlyError, type ActionResult } from "@/lib/errors";

/** Coût d'achat privé d'un produit (RLS : seul le propriétaire de la boutique y accède). */
export async function saveCostAction(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const p = z.object({ productId: z.string().uuid(), unit: z.coerce.number().int().min(0).max(100_000_000), extra: z.coerce.number().int().min(0).max(100_000_000) })
    .safeParse({ productId: form.get("productId"), unit: form.get("unit") || 0, extra: form.get("extra") || 0 });
  if (!p.success) return { ok: false, error: "Montant invalide." };
  const sb = await supabaseServer();
  const { data: prod } = await sb.from("products").select("shop_id").eq("id", p.data.productId).maybeSingle();
  if (!prod) return { ok: false, error: "Produit introuvable." };
  const { error } = await sb.from("product_costs").upsert({ product_id: p.data.productId, shop_id: prod.shop_id, unit_cost: p.data.unit, extra_cost: p.data.extra, updated_at: new Date().toISOString() });
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/vendeur/ia/prix");
  return { ok: true, message: "Coût enregistré (visible par vous seul)." };
}

export async function generatePlanAction(): Promise<ActionResult> {
  const sb = await supabaseServer();
  const { data, error } = await sb.rpc("generate_action_plan");
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/vendeur/ia", "layout");
  return { ok: true, message: data ? `${data} recommandation(s) analysée(s) pour cette semaine.` : "Aucune nouvelle recommandation : tout est à jour." };
}

export async function setActionStatusAction(id: string, status: "accepted" | "refused" | "postponed" | "done" | "proposed"): Promise<ActionResult> {
  const sb = await supabaseServer();
  const { error } = await sb.rpc("set_ai_action_status", { p_id: id, p_status: status });
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/vendeur/ia", "layout");
  return { ok: true, message: { accepted: "Recommandation acceptée.", refused: "Recommandation écartée.", postponed: "Reportée d'une semaine.", done: "Bravo, c'est fait !", proposed: "Remise à faire." }[status] };
}
