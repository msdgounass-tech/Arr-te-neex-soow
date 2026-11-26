import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { Profile, Shop, Subscription, SubscriptionStatus } from "@/lib/types";

export const getUser = cache(async () => {
  if (!isSupabaseConfigured) return null;
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
});

export async function requireUser(next: string) {
  const user = await getUser();
  if (!user) redirect(`/connexion?suite=${encodeURIComponent(next)}`);
  return user;
}

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await supabaseServer();
  const { data } = await supabase.from("profiles").select("id, full_name, phone, avatar_url, notify_promotions, is_platform_admin").eq("id", user.id).maybeSingle();
  return data as Profile | null;
});

export function effectiveStatus(s: Subscription | null): SubscriptionStatus {
  if (!s) return "expired";
  const now = Date.now();
  if (s.status === "suspended" || s.status === "pending_payment") return s.status;
  if (s.status === "active" && s.current_period_end && new Date(s.current_period_end).getTime() > now) return "active";
  if (s.status === "trial" && new Date(s.trial_ends_at).getTime() > now) return "trial";
  return "expired";
}

export interface MyShop { shop: Shop; subscription: Subscription | null; status: SubscriptionStatus; canManage: boolean }

export const getMyShop = cache(async (): Promise<MyShop | null> => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await supabaseServer();
  const { data } = await supabase.from("shops").select("*, subscription:subscriptions(*)").eq("owner_id", user.id).maybeSingle();
  if (!data) return null;
  const { subscription, ...shop } = data as Shop & { subscription: Subscription | Subscription[] | null };
  const sub = Array.isArray(subscription) ? subscription[0] ?? null : subscription;
  const status = effectiveStatus(sub);
  return { shop: shop as Shop, subscription: sub, status, canManage: status === "trial" || status === "active" };
});

export async function requireAdmin() {
  await requireUser("/admin");
  const profile = await getProfile();
  if (!profile?.is_platform_admin) redirect("/compte");
  return profile;
}

export async function requireShop() {
  await requireUser("/vendeur");
  const mine = await getMyShop();
  if (!mine) redirect("/vendre");
  return mine;
}
