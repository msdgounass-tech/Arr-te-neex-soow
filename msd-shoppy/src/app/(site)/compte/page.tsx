import type { Metadata } from "next";
import Link from "next/link";
import { getMyShop, getProfile, requireUser } from "@/lib/auth";
import { AccountMenu } from "@/components/account/AccountNav";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Mon compte", robots: { index: false } };

export default async function AccountPage() {
  const user = await requireUser("/compte");
  const [profile, mine] = await Promise.all([getProfile(), getMyShop()]);
  return (
    <div className="container-page max-w-2xl py-6 md:py-10">
      <h1 className="text-2xl font-bold md:text-3xl">Bonjour {profile?.full_name?.split(" ")[0] || ""}</h1>
      <p className="mt-1 text-slate">{user.email}</p>
      <Link href={mine ? "/vendeur" : "/vendre"} className="press mt-6 flex items-center gap-4 rounded-3xl bg-ink p-5 text-white">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange"><Icon name="store" size={24} /></span>
        <span className="flex-1"><b className="block">{mine ? mine.shop.name : "Ouvrir ma boutique"}</b>
          <span className="text-sm text-white/80">{mine ? "Accéder à mon espace vendeur" : "7 jours d'essai gratuit, sans engagement"}</span></span>
        <Icon name="chevron-right" />
      </Link>
      {profile?.is_platform_admin && (
        <Link href="/admin" className="press mt-3 flex items-center gap-4 rounded-3xl border-2 border-orange-strong p-5">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-soft text-orange-text"><Icon name="shield" size={24} /></span>
          <span className="flex-1"><b className="block">Administration de Shoppy by MSD</b><span className="text-sm text-slate">Toutes les boutiques, commandes, paiements et utilisateurs</span></span>
          <Icon name="chevron-right" />
        </Link>
      )}
      <div className="mt-6"><AccountMenu /></div>
    </div>
  );
}
