"use client";
import { useActionState } from "react";
import { submitTicketAction } from "@/app/actions/support";

export function TicketForm({ email, page }: { email: string; page: string }) {
  const [state, action, pending] = useActionState(submitTicketAction, null);
  if (state?.ok) return <p role="status" className="card p-6 text-center">{state.message}</p>;
  return (
    <form action={action} noValidate className="card space-y-4 p-5">
      <div className="hidden" aria-hidden="true"><label>Site web<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <div><label className="label" htmlFor="t-email">Votre e-mail</label><input id="t-email" name="email" type="email" defaultValue={email} className="field" autoComplete="email" /></div>
      <div><label className="label" htmlFor="t-cat">Sujet</label><select id="t-cat" name="category" className="field" defaultValue="autre">
        <option value="commande">Une commande</option><option value="vendeur">Signaler un vendeur ou un produit</option><option value="compte">Mon compte</option>
        <option value="paiement">Abonnement ou paiement</option><option value="signalement">Problème technique</option><option value="autre">Autre</option></select></div>
      <div><label className="label" htmlFor="t-subject">Titre</label><input id="t-subject" name="subject" maxLength={140} className="field" /></div>
      <div><label className="label" htmlFor="t-msg">Message</label><textarea id="t-msg" name="message" rows={5} maxLength={4000} className="field" placeholder="Décrivez la situation. Pour une commande, indiquez son numéro (MS-…)." /></div>
      <div><label className="label" htmlFor="t-url">Lien de la page concernée (facultatif)</label><input id="t-url" name="page_url" defaultValue={page} className="field" /></div>
      {state && !state.ok && <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary press">{pending ? "Envoi…" : "Envoyer"}</button>
    </form>
  );
}
