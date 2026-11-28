import Link from "next/link";
import { getAiAccess } from "@/lib/ai/access";
import { AdminButton as ActButton } from "@/components/admin/AdminButton";
import { generatePlanAction, setActionStatusAction } from "@/app/actions/ai";
import { DataNote, Locked } from "@/components/ai/Locked";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Mon plan d'action" };
type A = { id: string; title: string; body: string; link: string | null; priority: number; status: string; week: string; postponed_until: string | null; decided_at: string | null };
const STATUS: Record<string, string> = { accepted: "Acceptée", refused: "Écartée", postponed: "Reportée", done: "Terminée", proposed: "À décider" };

export default async function PlanPage() {
  const { sb, level, matrix, plan } = await getAiAccess();
  if (level("action_plan") === "none") return <Locked feature="action_plan" matrix={matrix} expired={!plan} />;
  const { data } = await sb.from("ai_actions").select("*").order("created_at", { ascending: false }).limit(100);
  const rows = (data ?? []) as A[];
  const today = new Date().toISOString().slice(0, 10);
  const open = rows.filter((a) => a.status === "proposed" || a.status === "accepted" || (a.status === "postponed" && (a.postponed_until ?? "") <= today));
  const history = rows.filter((a) => !open.includes(a));
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Mon plan d'action</h2>
        <ActButton tone="primary" label="Analyser ma boutique cette semaine" action={generatePlanAction} />
      </div>
      <DataNote>Chaque recommandation vient d'un constat réel sur votre boutique (commandes, consultations, stock, qualité des fiches). Rien n'est modifié automatiquement : vous décidez.</DataNote>
      <section>
        <h3 className="mb-3 font-semibold">À faire</h3>
        {open.length ? <ul className="space-y-3">{[...open].sort((a, b) => a.priority - b.priority).map((a) => (
          <li key={a.id} className="card space-y-3 p-4">
            <div className="flex items-start gap-3"><span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${a.priority === 1 ? "bg-danger" : a.priority === 2 ? "bg-warning" : "bg-success"}`} aria-label={`Priorité ${a.priority}`} />
              <div className="min-w-0"><b className="block">{a.title}</b><p className="text-sm text-slate">{a.body}</p>
                {a.status === "accepted" && <span className="mt-1 inline-block rounded-full bg-orange-soft px-2 py-0.5 text-xs font-semibold text-orange-text">En cours</span>}</div></div>
            <div className="flex flex-wrap gap-2">
              {a.link && <Link href={a.link} className="btn btn-sm btn-secondary press">Ouvrir</Link>}
              {a.status !== "accepted" && <ActButton label="Accepter" action={setActionStatusAction.bind(null, a.id, "accepted")} />}
              <ActButton tone="primary" label="C'est fait" action={setActionStatusAction.bind(null, a.id, "done")} />
              <ActButton label="Reporter" action={setActionStatusAction.bind(null, a.id, "postponed")} />
              <ActButton label="Écarter" action={setActionStatusAction.bind(null, a.id, "refused")} />
            </div>
          </li>))}</ul> : <p className="text-sm text-slate">Rien à faire pour l'instant. Lancez une analyse pour obtenir les recommandations de la semaine.</p>}
      </section>
      {history.length > 0 && (
        <section className="card p-5"><h3 className="font-semibold">Historique</h3>
          <ul className="mt-3 divide-y divide-line text-sm">{history.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 py-2"><span className="min-w-0 truncate">{a.title}</span>
              <span className="shrink-0 text-xs text-slate">{STATUS[a.status]}{a.decided_at ? ` · ${formatDate(a.decided_at)}` : ""}</span></li>))}</ul></section>
      )}
    </div>
  );
}
