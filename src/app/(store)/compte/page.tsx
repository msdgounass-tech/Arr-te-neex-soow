import type { Metadata } from "next";
import Link from "next/link";
import { getProfile, hasRole } from "@/lib/auth";
import { AccountShell } from "@/components/account/AccountShell";
import { ProfileForm } from "@/components/account/ProfileForm";
import { formatDate, formatPrice, ORDER_STATUS_LABEL } from "@/lib/format";

export const metadata: Metadata = { title: "Mon compte", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const { sb, user, profile } = await getProfile();
  const { data: orders } = await sb.from("orders").select("id, order_number, status, total, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(3);
  return (
    <AccountShell title={`Bonjour${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`} active="/compte" isStaff={hasRole(profile?.role ?? "customer", "staff")}>
      {orders && orders.length > 0 && (
        <section className="mb-14">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="display text-3xl">Commandes récentes</h2>
            <Link href="/compte/commandes" className="text-[0.8rem] uppercase tracking-[0.24em] text-accent">Tout voir</Link>
          </div>
          <ul className="divide-y divide-white/[0.06] border-y border-white/[0.1]">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/compte/commandes/${o.id}`} className="flex flex-wrap items-center justify-between gap-3 py-4 hover:text-accent">
                  <span className="tracking-wider">{o.order_number}</span>
                  <span className="text-sm text-mist">{formatDate(o.created_at)}</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-accent">{ORDER_STATUS_LABEL[o.status as keyof typeof ORDER_STATUS_LABEL]}</span>
                  <span>{formatPrice(o.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <h2 className="display mb-8 text-3xl">Mes informations</h2>
      <ProfileForm profile={{ full_name: profile?.full_name ?? "", phone: profile?.phone ?? "", whatsapp: profile?.whatsapp ?? "" }} email={user.email || ""} />
    </AccountShell>
  );
}
