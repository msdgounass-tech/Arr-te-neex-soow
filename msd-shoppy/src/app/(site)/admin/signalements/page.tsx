import { supabaseServer } from "@/lib/supabase/server";
import { AdminButton } from "@/components/admin/AdminButton";
import { setTicketStatusAction } from "@/app/actions/admin";
import { EmptyState, PageTitle, Pill } from "@/components/ui/bits";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Signalements" };
type Row = { id: string; email: string; category: string; subject: string; message: string; page_url: string | null; status: string; created_at: string };

export default async function TicketsAdmin() {
  const sb = await supabaseServer();
  const { data } = await sb.from("support_tickets").select("*").order("status").order("created_at", { ascending: false }).limit(300);
  const rows = (data ?? []) as Row[];
  return (
    <div>
      <PageTitle title="Signalements et assistance" subtitle="Messages envoyés depuis « Signaler un problème ». Répondez par e-mail." />
      {!rows.length ? <EmptyState icon="flag" title="Aucun message" /> : (
        <ul className="space-y-3">{rows.map((t) => (
          <li key={t.id} className="card space-y-2 p-4">
            <div className="flex items-start justify-between gap-3"><p className="font-semibold">{t.subject}</p><Pill tone={t.status === "open" ? "warning" : "neutral"}>{t.status === "open" ? "Ouvert" : "Clos"}</Pill></div>
            <p className="text-xs text-slate">{t.category} · {formatDate(t.created_at, true)} · <a className="link" href={`mailto:${t.email}?subject=${encodeURIComponent("Re : " + t.subject)}`}>{t.email}</a></p>
            <p className="whitespace-pre-line text-sm">{t.message}</p>
            {t.page_url && <p className="break-all text-xs text-slate">Page : {t.page_url}</p>}
            <AdminButton label={t.status === "open" ? "Marquer comme traité" : "Rouvrir"} action={setTicketStatusAction.bind(null, t.id, t.status === "open" ? "closed" : "open")} />
          </li>))}</ul>
      )}
    </div>
  );
}
