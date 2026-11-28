import { supabaseServer } from "@/lib/supabase/server";
import { AdminButton } from "@/components/admin/AdminButton";
import { reviewPaymentAction } from "@/app/actions/admin";
import { EmptyState, PageTitle, Pill } from "@/components/ui/bits";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata = { title: "Paiements d'abonnement" };
type Row = { id: string; method: string; reference: string; status: string; amount: number | null; created_at: string; plan_code: string | null; cycle: string; shop: { name: string; slug: string } | null };
const PLAN: Record<string, string> = { starter: "Starter", pro: "Pro", business: "Business" };
const METHOD: Record<string, string> = { wave: "Wave", orange_money: "Orange Money", autre: "Autre" };

export default async function PaymentsPage() {
  const sb = await supabaseServer();
  const { data } = await sb.from("subscription_payments").select("id, method, reference, status, amount, created_at, plan_code, cycle, shop:shops(name, slug)").order("created_at", { ascending: false }).limit(200);
  const rows = (data ?? []) as unknown as Row[];
  const pending = rows.filter((r) => r.status === "pending");
  return (
    <div>
      <PageTitle title="Paiements d'abonnement" subtitle="Vérifiez la référence dans votre application Wave ou Orange Money avant de valider." />
      {!rows.length ? <EmptyState icon="wallet" title="Aucun paiement déclaré" /> : (
        <ul className="space-y-3">{[...pending, ...rows.filter((r) => r.status !== "pending")].map((r) => (
          <li key={r.id} className="card space-y-2 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><p className="truncate font-semibold">{r.shop?.name}</p>
                <p className="text-sm text-slate">{PLAN[r.plan_code ?? ""] ?? "Formule ?"} {r.cycle === "yearly" ? "annuelle" : "mensuelle"}{r.amount ? ` · ${formatPrice(r.amount)} attendus` : ""}</p>
                <p className="text-sm text-slate">{METHOD[r.method]} · réf. <b className="text-ink">{r.reference}</b></p>
                <p className="text-xs text-slate">{formatDate(r.created_at, true)}</p></div>
              <Pill tone={r.status === "validated" ? "success" : r.status === "rejected" ? "danger" : "warning"}>{r.status === "validated" ? "Validé" : r.status === "rejected" ? "Refusé" : "À vérifier"}</Pill>
            </div>
            {r.status === "pending" && (
              <div className="flex flex-wrap gap-2">
                <AdminButton tone="primary" label={r.cycle === "yearly" ? "Valider (12 mois)" : "Valider (30 jours)"} action={reviewPaymentAction.bind(null, r.id, true, null)}
                  confirmText={`Confirmer : ${r.amount ? formatPrice(r.amount) : "le montant"} bien reçu${r.amount ? "" : ""} ?`} />
                <AdminButton tone="danger" label="Refuser" action={reviewPaymentAction.bind(null, r.id, false, null)} confirmText="Refuser ce paiement ?" />
              </div>
            )}
          </li>))}</ul>
      )}
    </div>
  );
}
