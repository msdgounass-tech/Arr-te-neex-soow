import "server-only";
import { cache } from "react";
import { requireShop } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { aiConfigured } from "@/lib/ai/provider";
import type { Level } from "@/lib/plans";

export interface FeatureAccess { level: Level; quota: number | null; used: number }
export type Access = Record<string, FeatureAccess>;

/** Droits de la boutique connectée (lus en base : plan_features + ai_modules + abonnement). */
export const getAiAccess = cache(async () => {
  const mine = await requireShop();
  const sb = await supabaseServer();
  const [{ data: summary }, { data: plan }, { data: matrix }] = await Promise.all([
    sb.rpc("ai_usage_summary"), sb.rpc("my_plan"), sb.from("plan_features").select("plan_code, feature, level")]);
  const access = (summary ?? {}) as Access;
  const level = (f: string): Level => access[f]?.level ?? "none";
  return { mine, sb, plan: (plan as string | null) ?? null, access, level, matrix: (matrix ?? []) as { plan_code: string; feature: string; level: Level }[], aiReady: aiConfigured() };
});
