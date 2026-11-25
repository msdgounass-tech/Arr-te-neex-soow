import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PageTitle } from "@/components/ui/bits";
import { ChangeEmail, ChangePassword, SignOutEverywhere } from "@/components/account/SecurityForms";
import { ActionForm } from "@/components/account/forms";
import { deleteAccountAction } from "@/app/actions/account";

export const metadata: Metadata = { title: "Sécurité du compte", robots: { index: false } };

export default async function SecurityPage() {
  const user = await requireUser("/compte/securite");
  return (
    <div className="container-page max-w-xl space-y-4 py-6 md:py-10">
      <PageTitle title="Sécurité du compte" back="/compte" />
      <section className="card p-5"><h2 className="mb-3 font-semibold">Mot de passe</h2><ChangePassword /></section>
      <section className="card p-5"><h2 className="mb-3 font-semibold">Adresse e-mail</h2><ChangeEmail current={user.email ?? ""} /></section>
      <section className="card p-5"><h2 className="mb-1 font-semibold">Sessions</h2><p className="mb-3 text-sm text-slate">Utile si vous avez perdu un téléphone ou utilisé un appareil partagé.</p><SignOutEverywhere /></section>
      <section className="card border-danger/30 p-5">
        <h2 className="font-semibold text-danger">Supprimer mon compte</h2>
        <p className="mb-3 mt-1 text-sm text-slate">Vos informations personnelles, adresses et favoris seront effacés. Les commandes passées sont conservées de façon anonyme pour les vendeurs concernés. Si vous avez une boutique, contactez d'abord l'assistance.</p>
        <ActionForm action={deleteAccountAction} submitLabel="Supprimer définitivement" danger>
          <div><label className="label" htmlFor="confirm">Saisissez SUPPRIMER pour confirmer</label><input id="confirm" name="confirm" className="field" autoComplete="off" /></div>
        </ActionForm>
      </section>
    </div>
  );
}
