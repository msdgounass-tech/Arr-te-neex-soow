import type { Metadata } from "next";
import { getProfile, requireUser } from "@/lib/auth";
import { ActionForm } from "@/components/account/forms";
import { PageTitle } from "@/components/ui/bits";
import { updateProfileAction } from "@/app/actions/account";

export const metadata: Metadata = { title: "Informations personnelles", robots: { index: false } };

export default async function ProfilePage() {
  const user = await requireUser("/compte/profil");
  const profile = await getProfile();
  return (
    <div className="container-page max-w-xl py-6 md:py-10">
      <PageTitle title="Informations personnelles" back="/compte" />
      <ActionForm action={updateProfileAction} submitLabel="Enregistrer" className="card space-y-4 p-5">
        <div><label className="label" htmlFor="full_name">Nom complet</label><input id="full_name" name="full_name" className="field" defaultValue={profile?.full_name ?? ""} autoComplete="name" /></div>
        <div><label className="label" htmlFor="phone">Téléphone</label><input id="phone" name="phone" type="tel" className="field" defaultValue={profile?.phone ?? ""} placeholder="77 123 45 67" autoComplete="tel" />
          <p className="hint">Privé : utilisé pour vos commandes, jamais affiché publiquement.</p></div>
        <div><span className="label">Adresse e-mail</span><p className="text-sm">{user.email}</p><p className="hint">Modifiable dans Sécurité du compte.</p></div>
      </ActionForm>
    </div>
  );
}
