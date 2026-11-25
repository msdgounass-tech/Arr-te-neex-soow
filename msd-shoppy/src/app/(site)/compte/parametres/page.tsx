import type { Metadata } from "next";
import { getProfile, requireUser } from "@/lib/auth";
import { PageTitle } from "@/components/ui/bits";
import { PromoToggle } from "@/components/account/PromoToggle";
import { SoundToggle } from "@/components/layout/SoundToggle";

export const metadata: Metadata = { title: "Paramètres", robots: { index: false } };

export default async function SettingsPage() {
  await requireUser("/compte/parametres");
  const profile = await getProfile();
  return (
    <div className="container-page max-w-xl py-6 md:py-10">
      <PageTitle title="Paramètres" back="/compte" />
      <section className="card space-y-4 p-5"><h2 className="font-semibold">Notifications</h2><PromoToggle initial={profile?.notify_promotions ?? true} /></section>
      <section className="card mt-4 p-5"><h2 className="font-semibold">Ambiance sonore</h2><p className="mb-2 mt-1 text-sm text-slate">Musique d'ambiance légère, toujours désactivée au démarrage.</p><SoundToggle className="-ml-3" /></section>
    </div>
  );
}
