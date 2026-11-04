import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { formatDate, formatPrice, ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/format";
import { Card, PageTitle, PaymentBadge, StatusBadge, td, th } from "@/components/admin/ui";
import type { Order, OrderStatus } from "@/lib/types";

const PER = 30;

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ statut?: string; q?: string; page?: string }> }) {
  const { sb } = await requireRole("staff");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  let q = sb.from("orders").select("id, order_number, customer_name, phone, city, total, status, payment_status, payment_method, created_at", { count: "exact" }).order("created_at", { ascending: false });
  if (sp.statut && sp.statut in ORDER_STATUS_LABEL) q = q.eq("status", sp.statut);
  if (sp.q) {
    const term = sp.q.replace(/[%,()]/g, " ").trim().slice(0, 60);
    if (term) q = q.or(`order_number.ilike.%${term}%,customer_name.ilike.%${term}%,phone.ilike.%${term}%`);
  }
  const { data, count } = await q.range((page - 1) * PER, page * PER - 1);
  const orders = (data || []) as Order[];
  const pages = Math.ceil((count || 0) / PER);
  const link = (p: Record<string, string | undefined>) => {
    const s = new URLSearchParams(Object.entries({ statut: sp.statut, q: sp.q, ...p }).filter(([, v]) => v) as [string, string][]);
    return `/admin/commandes${s.toString() ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageTitle title="Commandes" subtitle={`${count ?? 0} commande(s)`} />
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar flex gap-1 overflow-x-auto">
          <Link href={link({ statut: undefined, page: undefined })} className={`shrink-0 px-3 py-1.5 text-[0.78rem] uppercase tracking-[0.18em] ${!sp.statut ? "bg-gold text-ink" : "text-ivory/90"}`}>Toutes</Link>
          {(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map((s) => (
            <Link key={s} href={link({ statut: s, page: undefined })} className={`shrink-0 px-3 py-1.5 text-[0.78rem] uppercase tracking-[0.18em] ${sp.statut === s ? "bg-gold text-ink" : "text-ivory/90"}`}>{ORDER_STATUS_LABEL[s]}</Link>
          ))}
        </div>
        <form className="flex gap-2">
          {sp.statut && <input type="hidden" name="statut" value={sp.statut} />}
          <input name="q" defaultValue={sp.q} placeholder="N°, client, téléphone" className="field-box w-64" />
          <button className="btn btn-ghost-gold min-h-10 px-4">Rechercher</button>
        </form>
      </div>
      <Card className="overflow-x-auto p-0 md:p-0">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-white/[0.1]"><tr className="[&>th]:px-4"><th className={th}>N°</th><th className={th}>Date</th><th className={th}>Client</th><th className={th}>Ville</th><th className={th}>Paiement</th><th className={th}>Statut</th><th className={`${th} text-right`}>Total</th></tr></thead>
          <tbody className="divide-y divide-white/[0.05]">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-ink-3 [&>td]:px-4">
                <td className={td}><Link href={`/admin/commandes/${o.id}`} className="text-gold">{o.order_number}</Link></td>
                <td className={`${td} text-mist`}>{formatDate(o.created_at, true)}</td>
                <td className={td}>{o.customer_name}<span className="block text-xs text-mist">{o.phone}</span></td>
                <td className={td}>{o.city}</td>
                <td className={td}>{PAYMENT_METHOD_LABEL[o.payment_method]}<span className="block"><PaymentBadge status={o.payment_status} /></span></td>
                <td className={td}><StatusBadge status={o.status} /></td>
                <td className={`${td} text-right`}>{formatPrice(o.total)}</td>
              </tr>
            ))}
            {!orders.length && <tr><td colSpan={7} className="p-8 text-center text-mist">Aucune commande.</td></tr>}
          </tbody>
        </table>
      </Card>
      {pages > 1 && (
        <div className="mt-6 flex gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={link({ page: String(p) })} className={`flex h-9 w-9 items-center justify-center border text-xs ${p === page ? "border-gold bg-gold text-ink" : "border-white/15"}`}>{p}</Link>
          ))}
        </div>
      )}
    </>
  );
}
