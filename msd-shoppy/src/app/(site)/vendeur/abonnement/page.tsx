import { requireShop } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { PageTitle, Pill } from "@/components/ui/bits";
import { PlanPicker } from "@/components/seller/PlanPicker";
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
          {status === "active" && subscription?.current_period_end && `Formule ${ps.find((x) => x.code === subscription.plan_code)?.name ?? ""} active jusqu'au ${formatDate(subscription.current_period_end)}. Un rappel vous est envoyé avant l'échéance.`}
          {status === "pending_payment" && "Votre paiement est en cours de vérification. Votre boutique sera réactivée dès sa validation."}
          {status === "expired" && "Votre boutique est temporairement invisible. Vos produits, commandes et historique sont conservés : réactivez votre abonnement pour reprendre."}
          {status === "suspended" && "Votre compte vendeur est suspendu. Contactez l'assistance pour en connaître la raison."}
        </p>
        <p className="mt-3 rounded-xl bg-mist p-3 text-xs text-slate">Les frais d'abonnement sont distincts des ventes de vos produits : Shoppy by MSD ne prélève rien sur vos ventes.</p>
      </section>

      <section className="space-y-3">
        <div><h2 className="font-semibold">Formules</h2>
          <p className="mt-1 text-sm text-slate">Pendant l'essai gratuit, toutes les fonctions Pro sont ouvertes. À l'expiration, rien n'est supprimé : vos produits et commandes sont conservés.</p></div>
        <PlanPicker plans={ps} current={status === "active" ? subscription?.plan_code ?? null : null}
          action={hasPending || status === "suspended" ? undefined : declarePaymentAction} />
        {hasPending && <p className="rounded-xl bg-warning-soft p-3 text-sm text-warning">Un paiement est en cours de vérification. Vous pourrez en déclarer un autre après son traitement.</p>}
      </section>

      {pays.length > 0 && (
        <section className="card p-5"><h2 className="font-semibold">Historique des paiements</h2>
          <ul className="mt-3 divide-y divide-line text-sm">{pays.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-2"><span>{formatDate(p.created_at)} · {ps.find((x) => x.code === p.plan_code)?.name ?? "Formule"} {p.cycle === "yearly" ? "annuelle" : "mensuelle"}{p.amount != null ? ` · ${formatPrice(p.amount)}` : ""} · {p.method === "wave" ? "Wave" : p.method === "orange_money" ? "Orange Money" : "Autre"} · {p.reference}</span>
              <Pill tone={p.status === "validated" ? "success" : p.status === "rejected" ? "danger" : "warning"}>{p.status === "validated" ? "Validé" : p.status === "rejected" ? "Refusé" : "En vérification"}</Pill></li>))}</ul></section>
      )}
    </div>
  );
}
