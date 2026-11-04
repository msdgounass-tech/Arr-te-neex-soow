import "server-only";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

const RANK: Record<UserRole, number> = { customer: 0, staff: 1, manager: 2, admin: 3 };

export async function requireUser(redirectTo = "/compte") {
  const sb = await getServerSupabase();
  if (!sb) redirect("/");
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/compte/connexion?redirect=${encodeURIComponent(redirectTo)}`);
  return { sb, user };
}

export async function getProfile() {
  const { sb, user } = await requireUser();
  const { data: profile } = await sb.from("profiles").select("*").eq("id", user.id).single();
  return { sb, user, profile: profile as { id: string; full_name: string | null; email: string | null; phone: string | null; whatsapp: string | null; role: UserRole } | null };
}

/** Garde d'accès back-office : vérifiée côté serveur à chaque page / action (RLS en seconde ligne). */
export async function requireRole(min: UserRole) {
  const ctx = await getProfile();
  const role = ctx.profile?.role ?? "customer";
  if (RANK[role] < RANK[min]) redirect(RANK[role] >= 1 ? "/admin" : "/compte");
  return { ...ctx, role };
}

export const hasRole = (role: UserRole, min: UserRole) => RANK[role] >= RANK[min];
