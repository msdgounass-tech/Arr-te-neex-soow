import { getAiAccess } from "@/lib/ai/access";
import { DataNote, Locked } from "@/components/ai/Locked";
import { Advisor, AdvisorAnswer, type AdvisorOut } from "@/components/ai/Advisor";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Poser une question" };

export default async function AdvisorPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const { sb, level, matrix, plan, aiReady, mine } = await getAiAccess();
  if (level("ai_chat") === "none") return <Locked feature="ai_chat" matrix={matrix} expired={!plan} />;
  const { data: history } = await sb.from("ai_usage").select("id, created_at, output").eq("shop_id", mine.shop.id).eq("task", "advisor").eq("status", "ok")
    .order("created_at", { ascending: false }).limit(5);
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold">Poser une question à Shoppy AI</h2>
      <DataNote>Shoppy AI répond à partir de vos données réelles des 30 derniers jours (produits, consultations, commandes, coûts renseignés, prix publics du marché Shoppy). Il indique toujours les limites de son analyse.</DataNote>
      {!aiReady ? <DataNote>La conversation avec Shoppy AI n'est pas encore activée sur la plateforme.</DataNote> : <Advisor initial={q} />}
      {(history ?? []).length > 0 && (
        <section className="space-y-3"><h3 className="font-semibold">Historique de vos analyses</h3>
          {(history ?? []).map((h) => (
            <details key={h.id} className="card p-4"><summary className="cursor-pointer text-sm font-semibold">{formatDate(h.created_at, true)}</summary>
              <div className="mt-3"><AdvisorAnswer r={h.output as AdvisorOut} /></div></details>))}
        </section>
      )}
    </div>
  );
}
