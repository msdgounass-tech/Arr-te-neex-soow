import { requireShop } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { PageTitle, Pill } from "@/components/ui/bits";
import { ActionForm } from "@/components/account/forms";
import { declarePaymentAction } from "@/app/actions/seller";
import { formatDate, formatPrice } from "@/lib/format";
import type { SubscriptionPayment, SubscriptionPlan, SubscriptionStatus } from "@/lib/types";

export const metadata = { title: "Abonnement" };
const LABEL: Record<SubscriptionStatus, [string, "success" | "warning" | "danger" | "orange"]> = {
  trial: ["Essai gratuit", "orange"], active: ["Abonnement actif", "success"], pending_payment: ["Paiement en attente", "warning"],
  expired: ["Abonnement expiré", "danger"], suspended: ["Compte suspendu", "danger"],
};

export default async function SubscriptionPage() {
  const { subscription, status } = await requireShop();
  const sb = await supabaseServer();
  const [{ data: plans }, { data: payments }] = await Promise.all([
    sb.from("subscription_plans").select("*").eq("active", true).order("price_xof"),
    sb.from("subscription_payments").select("*").order("created_at", { ascending: false }).limit(20)]);
  const ps = (plans ?? []) as SubscriptionPlan[];
  const pays = (payments ?? []) as SubscriptionPayment[];
  const hasPending = pays.some((p) => p.status === "pending");
  const [label, tone] = LABEL[status];
  return (
    <div className="space-y-6">
      <PageTitle title="Abonnement" />
      <section className="card p-5">
        <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Statut</h2><Pill tone={tone}>{label}</Pill></div>
        <p className="mt-2 text-sm text-slate">
          {status === "trial" && subscription && `Votre essai gratuit se termine le ${formatDate(subscription.trial_ends_at, true)}.`}
          {status === "active" && subscription?.current_period_end && `Abonnement actif jusqu'au ${formatDate(subscription.current_period_end)}.`}
          {status === "pending_payment" && "Votre paiement est en cours de vérification. Votre boutique sera réactivée dès sa validation."}
          {status === "expired" && "Votre boutique est temporairement invisible. Vos produits, commandes et historique sont conservés : réactivez votre abonnement pour reprendre."}
          {status === "suspended" && "Votre compte vendeur est suspendu. Contactez l'assistance pour en connaître la raison."}
        </p>
        <p className="mt-3 rounded-xl bg-mist p-3 text-xs text-slate">Les frais d'abonnement sont distincts des ventes de vos produits : MSD Shoppy ne prélève rien sur vos ventes.</p>
      </section>

      <section className="card p-5">
        <h2 className="font-semibold">Formules</h2>
        {ps.length ? (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">{ps.map((p) => (
            <li key={p.code} className="rounded-2xl border border-line p-4"><b>{p.name}</b><p className="font-display text-2xl font-bold">{p.price_xof != null ? formatPrice(p.price_xof) : "Tarif à venir"}</p><p className="text-sm text-slate">pour {p.period_days} jours</p></li>))}</ul>
        ) : <p className="mt-2 text-sm text-slate">Les formules et leurs tarifs sont en cours de définition. Vous serez prévenu par notification avant la fin de votre essai. Aucun paiement n'est demandé pour le moment.</p>}
      </section>

      {status !== "suspended" && (
        <section className="card p-5">
          <h2 className="font-semibold">Déclarer un paiement</h2>
          <p className="mb-4 mt-1 text-sm text-slate">Après avoir payé par Wave ou Orange Money selon les instructions reçues, indiquez la référence de la transaction. L'abonnement est activé uniquement après vérification du paiement.</p>
          {hasPending ? <p className="rounded-xl bg-warning-soft p-3 text-sm text-warning">Un paiement est déjà en cours de vérification.</p> : (
            <ActionForm action={declarePaymentAction} submitLabel="Envoyer pour vérification">
              <div><label className="label" htmlFor="method">Moyen de paiement</label><select id="method" name="method" className="field"><option value="wave">Wave</option><option value="orange_money">Orange Money</option><option value="autre">Autre</option></select></div>
              {ps.length > 0 && <div><label className="label" htmlFor="plan">Formule</label><select id="plan" name="plan" className="field">{ps.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}</select></div>}
              <div><label className="label" htmlFor="reference">Référence de la transaction</label><input id="reference" name="reference" className="field" maxLength={80} placeholder="Ex. T0ABC12345" /></div>
            </ActionForm>
          )}
        </section>
      )}

      {pays.length > 0 && (
        <section className="card p-5"><h2 className="font-semibold">Historique des paiements</h2>
          <ul className="mt-3 divide-y divide-line text-sm">{pays.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-2"><span>{formatDate(p.created_at)} · {p.method === "wave" ? "Wave" : p.method === "orange_money" ? "Orange Money" : "Autre"} · {p.reference}</span>
              <Pill tone={p.status === "validated" ? "success" : p.status === "rejected" ? "danger" : "warning"}>{p.status === "validated" ? "Validé" : p.status === "rejected" ? "Refusé" : "En vérification"}</Pill></li>))}</ul></section>
      )}
    </div>
  );
}
