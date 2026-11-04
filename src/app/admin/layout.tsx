import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata: Metadata = { title: "Administration", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, role, user } = await requireRole("staff");
  return (
    <div className="min-h-dvh bg-ink lg:flex">
      <AdminNav role={role} name={profile?.full_name || user.email || ""} />
      <div className="min-w-0 flex-1 px-5 py-8 md:px-10 md:py-10">{children}</div>
    </div>
  );
}
