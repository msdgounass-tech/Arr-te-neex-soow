"use client";
import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/types";

/**
 * Rôle de la personne connectée (lu via RLS : chacun ne lit que son profil).
 * Sert uniquement à afficher les raccourcis d'administration ; l'accès réel
 * reste contrôlé côté serveur par requireRole et les règles RLS.
 */
export function useStaffRole(): UserRole | null {
  const [role, setRole] = useState<UserRole | null>(null);
  useEffect(() => {
    const sb = getBrowserSupabase();
    if (!sb) return;
    let alive = true;
    const load = async (uid?: string) => {
      if (!uid) return alive && setRole(null);
      const { data } = await sb.from("profiles").select("role").eq("id", uid).maybeSingle();
      if (alive) setRole(((data?.role as UserRole) ?? null));
    };
    sb.auth.getUser().then(({ data }) => load(data.user?.id));
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => load(s?.user?.id));
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);
  return role && role !== "customer" ? role : null;
}
