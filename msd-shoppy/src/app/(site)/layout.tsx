import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "@/components/layout/Providers";
import { SetupNotice } from "@/components/ui/bits";
import { getUser } from "@/lib/auth";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

async function unreadCount(userId: string | undefined) {
  if (!userId) return 0;
  const sb = await supabaseServer();
  const { count } = await sb.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null);
  return count ?? 0;
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  const unread = await unreadCount(user?.id);
  return (
    <Providers userId={user?.id ?? null}>
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white">
        Aller au contenu
      </a>
      <Header signedIn={Boolean(user)} unread={unread} />
      {!isSupabaseConfigured && <SetupNotice />}
      {isDemoMode && (
        <p className="bg-ink px-4 py-2 text-center text-xs text-white">
          Mode démo : les boutiques marquées « Démo » contiennent des données fictives. <Link href="/demo" className="font-semibold underline">Essayer avec un compte de démonstration</Link>
        </p>
      )}
      <main id="contenu" className="pb-24 md:pb-0">{children}</main>
      <Footer />
      <BottomNav />
    </Providers>
  );
}
