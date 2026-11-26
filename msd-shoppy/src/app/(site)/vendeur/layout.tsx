import type { Metadata } from "next";
import Link from "next/link";
import { requireShop } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { SellerNav } from "@/components/seller/SellerNav";
import { ShopAvatar } from "@/components/shop/ShopCard";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: { default: "Espace vendeur", template: "%s · Espace vendeur" }, robots: { index: false } };

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const { shop, subscription, status } = await requireShop();
  const sb = await supabaseServer();
  await sb.rpc("ensure_subscription_reminders");
  const { count } = await sb.from("orders").select("id", { count: "exact", head: true }).eq("shop_id", shop.id).eq("status", "pending");
  const trialDays = subscription && status === "trial" ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / 86_400_000)) : null;
  return (
    <div className="container-page py-4 md:py-8">
      {status === "trial" && (
        <p className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl bg-orange-soft px-4 py-3 text-sm text-orange-text">
          <Icon name="clock" size={18} /> Essai gratuit : {trialDays} jour{trialDays === 1 ? "" : "s"} restant{trialDays === 1 ? "" : "s"}.
          <Link href="/vendeur/abonnement" className="font-semibold underline">Voir l'abonnement</Link>
        </p>
      )}
      {(status === "expired" || status === "pending_payment" || status === "suspended") && (
        <div role="status" className="mb-4 rounded-2xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
          <b>{status === "pending_payment" ? "Paiement en cours de vérification." : status === "suspended" ? "Compte vendeur suspendu." : "Votre abonnement a expiré."}</b>{" "}
          Votre boutique est temporairement invisible et la gestion des produits est en lecture seule. Vos produits, commandes et historique sont conservés.{" "}
          {status !== "suspended" && <Link href="/vendeur/abonnement" className="font-semibold underline">Réactiver ma boutique</Link>}
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-[230px_1fr]">
        <aside className="md:sticky md:top-20 md:h-fit">
          <Link href={`/b/${shop.slug}`} className="press mb-4 hidden items-center gap-3 rounded-2xl p-2 hover:bg-mist md:flex">
            <ShopAvatar shop={shop} size={40} /><span className="min-w-0"><b className="block truncate text-sm">{shop.name}</b><span className="text-xs text-slate">Voir ma boutique</span></span>
          </Link>
          <SellerNav pending={count ?? 0} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
