import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isDemoMode } from "@/lib/env";
import { DemoLogin, type DemoAccount } from "@/components/account/DemoLogin";
import { PageTitle } from "@/components/ui/bits";

export const metadata: Metadata = { title: "Mode démo", robots: { index: false } };

const ACCOUNTS: DemoAccount[] = [
  { email: "awa.couture@demo.msdshoppy.sn", name: "Awa Diop — Awa Couture", role: "Vendeuse · Mode · Dakar", icon: "store", next: "/vendeur",
    detail: "Boutique la plus active : commandes terminées, avis 4,6/5, badges « Vendeur confirmé » et « Très réactif ». Une commande en préparation à faire avancer." },
  { email: "moussa.tech@demo.msdshoppy.sn", name: "Moussa Ndiaye — Moussa Tech", role: "Vendeur · Électronique · Thiès", icon: "smartphone", next: "/vendeur/commandes",
    detail: "Une commande à confirmer et une commande expédiée : idéal pour essayer le traitement des commandes." },
  { email: "fatou.beaute@demo.msdshoppy.sn", name: "Fatou Sow — Fatou Beauté Naturelle", role: "Vendeuse · Beauté · Saint-Louis", icon: "sparkles", next: "/vendeur/statistiques",
    detail: "Statistiques de consultation, une commande en attente et deux avis vérifiés." },
  { email: "ibrahima.terroir@demo.msdshoppy.sn", name: "Ibrahima Fall — Terroir du Saloum", role: "Vendeur · Alimentation · Kaolack", icon: "basket", next: "/vendeur/assistant",
    detail: "Boutique sans avis encore : parfait pour voir l'assistant vendeur et la progression." },
  { email: "aminata.client@demo.msdshoppy.sn", name: "Aminata Ba", role: "Cliente · Dakar", icon: "user", next: "/compte/commandes",
    detail: "Plusieurs commandes à différentes étapes, des favoris et des avis déjà publiés." },
  { email: "cheikh.client@demo.msdshoppy.sn", name: "Cheikh Sarr", role: "Client · Thiès", icon: "user", next: "/compte/commandes",
    detail: "Une commande expédiée à confirmer à la réception, puis un avis à laisser." },
];

export default function DemoPage() {
  if (!isDemoMode) notFound();
  return (
    <div className="container-page max-w-3xl py-6 md:py-10">
      <PageTitle title="Mode démo" subtitle="Découvrez Shoppy by MSD côté client et côté vendeur avec des comptes de démonstration déjà prêts. Toutes les données de ces comptes sont fictives." />
      <DemoLogin accounts={ACCOUNTS} password="DemoMSD2026" />
      <p className="mt-6 rounded-2xl bg-mist p-4 text-sm text-slate">
        Mot de passe commun des comptes de démo : <b className="text-ink">DemoMSD2026</b>. Les boutiques de démonstration sont marquées « Démo » et seront supprimées avant l'ouverture au public.
      </p>
    </div>
  );
}
