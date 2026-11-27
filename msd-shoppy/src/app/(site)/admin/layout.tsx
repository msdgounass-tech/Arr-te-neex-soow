import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { AdminNav } from "@/components/admin/AdminNav";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: { default: "Administration", template: "%s · Administration" }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const sb = await supabaseServer();
  const { data } = await sb.rpc("admin_overview");
  const o = (data ?? {}) as Record<string, number>;
  return (
    <div className="container-page py-4 md:py-8">
      <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white"><Icon name="shield" size={14} /> Administration Shoppy by MSD</p>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="min-w-0 md:sticky md:top-20 md:h-fit"><AdminNav badges={{ "/admin/paiements": o.payments_pending ?? 0, "/admin/signalements": o.tickets_open ?? 0, "/admin/commandes": o.orders_pending ?? 0 }} /></aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
