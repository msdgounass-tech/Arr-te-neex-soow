import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { effectiveStatus } from "@/lib/auth";
import { AdminButton } from "@/components/admin/AdminButton";
import { setSubscriptionAction, setVerifiedAction } from "@/app/actions/admin";
import { ShopAvatar } from "@/components/shop/ShopCard";
import { EmptyState, PageTitle, Pill } from "@/components/ui/bits";
import { formatDate } from "@/lib/format";
import type { Shop, Subscription, SubscriptionStatus } from "@/lib/types";

export const metadata = { title: "Boutiques" };
const LABEL: Record<SubscriptionStatus, [string, "success" | "warning" | "danger" | "orange"]> = {
  trial: ["Essai", "orange"], active: ["Abonnée", "success"], pending_payment: ["Paiement en attente", "warning"], expired: ["Expirée", "danger"], suspended: ["Suspendue", "danger"],
};

export default async function ShopsAdmin({ searchParams }: { searchParams: Promise<{ q?: string; statut?: string }> }) {
  const { q = "", statut = "" } = await searchParams;
  const sb = await supabaseServer();
  let query = sb.from("shops").select("*, subscription:subscriptions(*), products(count), orders(count)").order("created_at", { ascending: false }).limit(300);
  if (q.trim()) query = query.ilike("name", `%${q.trim().replace(/[%_]/g, "")}%`);
  const { data } = await query;
  type Row = Shop & { subscription: Subscription | Subscription[] | null; products: { count: number }[]; orders: { count: number }[] };
  const rows = ((data ?? []) as Row[]).map((r) => {
    const sub = Array.isArray(r.subscription) ? r.subscription[0] ?? null : r.subscription;
    return { ...r, sub, status: effectiveStatus(sub) };
  }).filter((r) => !statut || r.status === statut);
  return (
    <div>
      <PageTitle title="Boutiques" subtitle={`${rows.length} boutique${rows.length > 1 ? "s" : ""}`} />
      <form className="mb-3 grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_auto_auto]"><label htmlFor="sq" className="sr-only">Rechercher</label><input id="sq" name="q" defaultValue={q} placeholder="Nom de boutique…" className="field col-span-2 sm:col-span-1" />
        <select name="statut" defaultValue={statut} className="field" aria-label="Statut"><option value="">Tous</option>{Object.entries(LABEL).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</select>
        <button className="btn btn-secondary press">OK</button></form>
      {!rows.length ? <EmptyState icon="store" title="Aucune boutique" /> : (
        <ul className="space-y-3">{rows.map((s) => {
          const [label, tone] = LABEL[s.status];
          return (
            <li key={s.id} className="card space-y-3 p-4">
              <div className="flex items-start gap-3">
                <ShopAvatar shop={s} size={44} />
                <div className="min-w-0 flex-1">
                  <Link href={`/b/${s.slug}`} className="block truncate font-semibold hover:underline">{s.name}</Link>
                  <p className="text-xs text-slate">{s.city}, {s.region} · créée le {formatDate(s.created_at)}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Pill tone={tone}>{label}</Pill>
                    {s.verified_at && <Pill tone="success">Vérifiée</Pill>}
                    {s.is_demo && <Pill>Démo</Pill>}
                    {!s.is_published && <Pill tone="warning">Fermée par le vendeur</Pill>}
                    <Pill>{s.products?.[0]?.count ?? 0} produits</Pill><Pill>{s.orders?.[0]?.count ?? 0} commandes</Pill>
                  </div>
                  {s.sub && <p className="mt-1 text-xs text-slate">{s.status === "trial" ? `Essai jusqu'au ${formatDate(s.sub.trial_ends_at)}` : s.sub.current_period_end ? `Période jusqu'au ${formatDate(s.sub.current_period_end)}` : ""}</p>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {s.verified_at ? <AdminButton label="Retirer « vérifiée »" action={setVerifiedAction.bind(null, s.id, false)} />
                  : <AdminButton tone="primary" label="Marquer vérifiée" action={setVerifiedAction.bind(null, s.id, true)} confirmText="Avez-vous contrôlé l'identité et les coordonnées de cette boutique ?" />}
                <AdminButton label="Activer 30 j" action={setSubscriptionAction.bind(null, s.id, "activate", 30)} confirmText="Activer l'abonnement 30 jours (paiement vérifié) ?" />
                <AdminButton label="Prolonger l'essai 7 j" action={setSubscriptionAction.bind(null, s.id, "extend_trial", 7)} />
                {s.status !== "suspended" && <AdminButton tone="danger" label="Suspendre" action={setSubscriptionAction.bind(null, s.id, "suspend")} confirmText="Suspendre cette boutique ? Elle devient invisible ; rien n'est supprimé." />}
              </div>
            </li>
          );
        })}</ul>
      )}
    </div>
  );
}
