import { requireRole, hasRole } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { Card, PageTitle, td, th } from "@/components/admin/ui";
import { setRole } from "../actions";

const ROLES = [["customer", "Client"], ["staff", "Équipe (commandes)"], ["manager", "Gérant (catalogue, promos, stats)"], ["admin", "Administrateur"]];

export default async function AdminClients({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { sb, role, user } = await requireRole("staff");
  const { q } = await searchParams;
  let query = sb.from("profiles").select("id, full_name, email, phone, role, created_at").order("created_at", { ascending: false }).limit(300);
  if (q) {
    const t = q.replace(/[%,()]/g, " ").trim().slice(0, 60);
    if (t) query = query.or(`full_name.ilike.%${t}%,email.ilike.%${t}%,phone.ilike.%${t}%`);
  }
  const { data } = await query;
  const isAdmin = hasRole(role, "admin");
  return (
    <>
      <PageTitle title="Clients & équipe" subtitle={`${data?.length ?? 0} compte(s)`} />
      <form className="mb-6 flex gap-2"><input name="q" defaultValue={q} placeholder="Nom, e-mail, téléphone" className="field-box w-72" /><button className="btn btn-ghost-gold min-h-10 px-4">Rechercher</button></form>
      <Card className="overflow-x-auto p-0 md:p-0">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-white/[0.1]"><tr className="[&>th]:px-4"><th className={th}>Nom</th><th className={th}>E-mail</th><th className={th}>Téléphone</th><th className={th}>Inscription</th><th className={th}>Rôle</th></tr></thead>
          <tbody className="divide-y divide-white/[0.05]">
            {(data || []).map((p) => (
              <tr key={p.id} className="[&>td]:px-4">
                <td className={td}>{p.full_name || "—"}</td>
                <td className={`${td} text-mist`}>{p.email}</td>
                <td className={td}>{p.phone || "—"}</td>
                <td className={`${td} text-mist`}>{formatDate(p.created_at)}</td>
                <td className={td}>
                  {isAdmin && p.id !== user.id ? (
                    <form action={setRole} className="flex gap-2">
                      <input type="hidden" name="id" value={p.id} />
                      <select name="role" defaultValue={p.role} className="field-box py-1 text-xs">{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                      <button className="text-[0.78rem] uppercase tracking-[0.16em] text-gold">OK</button>
                    </form>
                  ) : (
                    <span className="text-xs uppercase tracking-[0.14em] text-gold">{ROLES.find(([v]) => v === p.role)?.[1]}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
