import { requireRole, hasRole } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { Card, PageTitle } from "@/components/admin/ui";
import { markMessageRead } from "../actions";

export default async function AdminMessages() {
  const { sb, role } = await requireRole("staff");
  const [{ data: messages }, { data: subs, count }] = await Promise.all([
    sb.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(100),
    hasRole(role, "manager") ? sb.from("newsletter_subscribers").select("email, created_at", { count: "exact" }).order("created_at", { ascending: false }).limit(500) : Promise.resolve({ data: null, count: null }),
  ]);
  return (
    <>
      <PageTitle title="Messages" subtitle="Formulaire de contact et abonnés à la newsletter." />
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-3">
          {(messages || []).map((m) => (
            <Card key={m.id} className={m.is_read ? "opacity-60" : "border-accent/30"}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p>{m.name} <span className="ml-2 text-xs text-mist">{[m.email, m.phone].filter(Boolean).join(" · ")}</span></p>
                <p className="text-xs text-mist">{formatDate(m.created_at, true)}</p>
              </div>
              {m.subject && <p className="mt-2 text-sm text-accent">{m.subject}</p>}
              <p className="mt-2 whitespace-pre-line text-sm text-ivory/90">{m.message}</p>
              {!m.is_read && <form action={markMessageRead} className="mt-3"><input type="hidden" name="id" value={m.id} /><button className="text-[0.78rem] uppercase tracking-[0.16em] text-accent">Marquer comme traité</button></form>}
            </Card>
          ))}
          {!messages?.length && <Card><p className="text-sm text-mist">Aucun message.</p></Card>}
        </div>
        {subs && (
          <Card>
            <p className="label mb-4">Newsletter — {count} abonné(s)</p>
            <ul className="max-h-[60vh] space-y-1 overflow-y-auto text-xs text-ivory/90">{subs.map((s) => <li key={s.email}>{s.email}</li>)}</ul>
          </Card>
        )}
      </div>
    </>
  );
}
