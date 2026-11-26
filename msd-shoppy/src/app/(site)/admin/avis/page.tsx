import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { EmptyState, PageTitle, Stars } from "@/components/ui/bits";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Avis" };
type Row = { id: string; rating: number; comment: string; created_at: string; shop: { name: string; slug: string } | null };

export default async function ReviewsAdmin() {
  const sb = await supabaseServer();
  const { data } = await sb.from("reviews").select("id, rating, comment, created_at, shop:shops(name, slug)").order("created_at", { ascending: false }).limit(300);
  const rows = (data ?? []) as unknown as Row[];
  return (
    <div>
      <PageTitle title="Avis clients" subtitle="Tous les avis sont liés à une commande terminée." />
      {!rows.length ? <EmptyState icon="star" title="Aucun avis" /> : (
        <ul className="space-y-3">{rows.map((r) => (
          <li key={r.id} className="card p-4"><div className="flex items-center justify-between gap-3"><Stars value={r.rating} /><span className="text-xs text-slate">{formatDate(r.created_at)}</span></div>
            {r.comment && <p className="mt-1 text-sm">{r.comment}</p>}
            {r.shop && <Link href={`/b/${r.shop.slug}`} className="link mt-1 inline-block text-xs">{r.shop.name}</Link>}</li>))}</ul>
      )}
    </div>
  );
}
