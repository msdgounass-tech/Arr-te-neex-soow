import Image from "next/image";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { AdminButton } from "@/components/admin/AdminButton";
import { setProductStatusAdminAction } from "@/app/actions/admin";
import { EmptyState, PageTitle, Pill } from "@/components/ui/bits";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Produits" };
type Row = { id: string; slug: string; title: string; price: number; status: string; quality_score: number; availability: string; images: { url: string; position: number }[]; shop: { name: string } | null };

export default async function ProductsAdmin({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const sb = await supabaseServer();
  let query = sb.from("products").select("id, slug, title, price, status, quality_score, availability, images:product_images(url, position), shop:shops(name)").order("created_at", { ascending: false }).limit(200);
  if (q.trim()) query = query.ilike("title", `%${q.trim().replace(/[%_]/g, "")}%`);
  const rows = ((await query).data ?? []) as unknown as Row[];
  return (
    <div>
      <PageTitle title="Produits" subtitle="Masquez un produit qui ne respecte pas les règles de publication." />
      <form className="mb-3 flex gap-2"><label htmlFor="pq" className="sr-only">Rechercher</label><input id="pq" name="q" defaultValue={q} placeholder="Titre du produit…" className="field" /><button className="btn btn-secondary press">OK</button></form>
      {!rows.length ? <EmptyState icon="tag" title="Aucun produit" /> : (
        <ul className="space-y-3">{rows.map((p) => {
          const img = [...p.images].sort((a, b) => a.position - b.position)[0];
          return (
            <li key={p.id} className="card flex gap-3 p-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-mist">{img && <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />}</div>
              <div className="min-w-0 flex-1">
                {p.status === "published" ? <Link href={`/p/${p.slug}`} className="line-clamp-1 text-sm font-medium hover:underline">{p.title}</Link> : <p className="line-clamp-1 text-sm font-medium">{p.title}</p>}
                <p className="text-xs text-slate">{p.shop?.name} · {formatPrice(p.price)}</p>
                <div className="mt-1 flex flex-wrap gap-1.5"><Pill tone={p.status === "published" ? "success" : "neutral"}>{p.status === "published" ? "Publié" : p.status === "hidden" ? "Masqué" : "Brouillon"}</Pill><Pill>Qualité {p.quality_score}</Pill></div>
                <div className="mt-2">{p.status === "published"
                  ? <AdminButton tone="danger" label="Masquer" action={setProductStatusAdminAction.bind(null, p.id, "hidden")} confirmText="Masquer ce produit du public ?" />
                  : p.status === "hidden" ? <AdminButton label="Republier" action={setProductStatusAdminAction.bind(null, p.id, "published")} /> : null}</div>
              </div>
            </li>
          );
        })}</ul>
      )}
    </div>
  );
}
