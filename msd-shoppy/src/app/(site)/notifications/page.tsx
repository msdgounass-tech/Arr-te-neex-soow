import type { Metadata } from "next";
import Link from "next/link";
import { getProfile, requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { EmptyState, PageTitle } from "@/components/ui/bits";
import { NotificationList } from "@/components/account/NotificationList";
import type { Notification } from "@/lib/types";

export const metadata: Metadata = { title: "Notifications", robots: { index: false } };

export default async function NotificationsPage() {
  await requireUser("/notifications");
  const sb = await supabaseServer();
  const [profile, { data }] = await Promise.all([getProfile(), sb.from("notifications").select("*").order("created_at", { ascending: false }).limit(100)]);
  const items = ((data ?? []) as Notification[]).filter((n) => profile?.notify_promotions !== false || !n.is_promotional);
  return (
    <div className="container-page max-w-2xl py-6 md:py-10">
      <PageTitle title="Notifications" action={<Link href="/compte/parametres" className="link text-sm">Préférences</Link>} />
      {items.length ? <NotificationList items={items} /> : <EmptyState icon="bell" title="Aucune notification" text="Vous serez prévenu ici des nouvelles commandes, des changements de statut et de votre abonnement." />}
    </div>
  );
}
