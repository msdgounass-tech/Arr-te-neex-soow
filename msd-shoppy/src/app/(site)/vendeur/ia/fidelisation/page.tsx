import { getAiAccess } from "@/lib/ai/access";
import { DataNote, Locked } from "@/components/ai/Locked";
import { ReplyDrafter } from "@/components/ai/ReplyDrafter";
import { Stars } from "@/components/ui/bits";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Fidéliser mes clients" };

export default async function LoyaltyPage() {
  const { sb, level, matrix, aiReady, mine } = await getAiAccess();
  const [{ data: reviews }, { data: orders }] = await Promise.all([
    sb.from("reviews").select("id, rating, comment, created_at").eq("shop_id", mine.shop.id).order("created_at", { ascending: false }).limit(200),
    sb.from("orders").select("buyer_id, status").eq("shop_id", mine.shop.id).not("status", "in", "(refused,cancelled)").limit(5000)]);
  const rv = reviews ?? [];
  const avg = rv.length ? Math.round((rv.reduce((s, r) => s + r.rating, 0) / rv.length) * 10) / 10 : null;
  const low = rv.filter((r) => r.rating <= 3);
  const byBuyer = new Map<string, number>(); for (const o of orders ?? []) byBuyer.set(o.buyer_id, (byBuyer.get(o.buyer_id) ?? 0) + 1);
  const buyers = byBuyer.size, regulars = [...byBuyer.values()].filter((n) => n >= 2).length;
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Fidéliser mes clients</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="card p-4"><span className="text-sm text-slate">Note moyenne</span><b className="block font-display text-2xl">{avg ?? "—"}</b>{avg != null && <Stars value={avg} />}</div>
        <div className="card p-4"><span className="text-sm text-slate">Avis vérifiés</span><b className="block font-display text-2xl">{rv.length}</b></div>
        <div className="card p-4"><span className="text-sm text-slate">Clients</span><b className="block font-display text-2xl">{buyers}</b></div>
        <div className="card p-4"><span className="text-sm text-slate">Clients réguliers (2 commandes et +)</span><b className="block font-display text-2xl">{regulars}</b>
          {buyers > 0 && <span className="text-xs text-slate">{Math.round((regulars / buyers) * 100)} % de vos clients</span>}</div>
      </div>
      <section className="card p-5"><h3 className="font-semibold">Avis à traiter en priorité</h3>
        {low.length ? <ul className="mt-3 space-y-3">{low.slice(0, 8).map((r) => (
          <li key={r.id} className="rounded-xl border border-line p-3 text-sm"><div className="flex items-center gap-2"><Stars value={r.rating} /><span className="text-xs text-slate">{formatDate(r.created_at)}</span></div>
            <p className="mt-1">{r.comment || <span className="text-slate">Sans commentaire</span>}</p></li>))}</ul>
          : <p className="mt-2 text-sm text-slate">Aucun avis de 3 étoiles ou moins. Continuez ainsi !</p>}
      </section>
      <section className="card space-y-3 p-5"><h3 className="font-semibold">Répondre à un client avec Shoppy AI</h3>
        {level("ai_chat") === "none" ? <Locked feature="ai_chat" matrix={matrix} /> : !aiReady ? <DataNote>La génération par IA n'est pas encore activée sur la plateforme.</DataNote> : <ReplyDrafter initial={low[0]?.comment ?? ""} />}
      </section>
      <DataNote>Relance des clients intéressés : à venir. Elle se fera uniquement auprès des clients qui ont accepté de recevoir des offres (réglage « promotions » de leur compte).</DataNote>
    </div>
  );
}
