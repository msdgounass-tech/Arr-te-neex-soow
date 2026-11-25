"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { Toaster } from "@/components/ui/Toaster";
import { favorites } from "@/lib/store/favorites";
import { supabaseBrowser } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import type { AuthChangeEvent } from "@supabase/supabase-js";

export function Providers({ userId, children }: { userId: string | null; children: React.ReactNode }) {
  const router = useRouter();
  useEffect(() => { void favorites.syncWithAccount(userId); }, [userId]);
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const { data } = supabaseBrowser().auth.onAuthStateChange((event: AuthChangeEvent) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") router.refresh();
    });
    return () => data.subscription.unsubscribe();
  }, [router]);
  return (
    <MotionProvider>
      {children}
      <Toaster />
    </MotionProvider>
  );
}
