import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { EmptyState, PageTitle, Pill } from "@/components/ui/bits";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Utilisateurs" };
type Row = { id: string; email: string; full_name: string; phone: string | null; created_at: string; last_sign_in_at: string | null; is_admin: boolean; shop_name: string | null; shop_slug: string | null; orders_count: number };

export default async function UsersAdmin({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const sb = await supabaseServer();
  const { data } = await sb.rpc("admin_users", { p_search: q || null, p_limit: 300 });
  const rows = (data ?? []) as Row[];
  return (
    <div>
      <PageTitle title="Utilisateurs" subtitle={`${rows.length} compte${rows.length > 1 ? "s" : ""}`} />
      <form className="mb-3 flex gap-2"><label htmlFor="uq" className="sr-only">Rechercher</label><input id="uq" name="q" defaultValue={q} placeholder="Nom ou e-mail…" className="field" /><button className="btn btn-secondary press">OK</button></form>
      {!rows.length ? <EmptyState icon="user" title="Aucun compte" /> : (
        <ul className="space-y-3">{rows.map((u) => (
          <li key={u.id} className="card p-4">
            <p className="font-semibold">{u.full_name || "Sans nom"}</p>
            <p className="break-all text-sm text-slate">{u.email}{u.phone ? ` · ${u.phone}` : ""}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {u.is_admin && <Pill tone="orange">Administrateur</Pill>}
              {u.shop_name && <Link href={`/b/${u.shop_slug}`}><Pill tone="success">Vendeur : {u.shop_name}</Pill></Link>}
              <Pill>{u.orders_count} commande{u.orders_count > 1 ? "s" : ""}</Pill>
              {u.email.endsWith("@demo.msdshoppy.sn") && <Pill>Démo</Pill>}
            </div>
            <p className="mt-1 text-xs text-slate">Inscrit le {formatDate(u.created_at)}{u.last_sign_in_at ? ` · dernière connexion ${formatDate(u.last_sign_in_at, true)}` : ""}</p>
          </li>))}</ul>
      )}
    </div>
  );
}
