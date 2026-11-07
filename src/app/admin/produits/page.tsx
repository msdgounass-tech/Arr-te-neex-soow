import Image from "next/image";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { Card, PageTitle, td, th } from "@/components/admin/ui";
import { toggleProduct } from "../actions";

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ q?: string; stock?: string }> }) {
  const { sb } = await requireRole("manager");
  const sp = await searchParams;
  let q = sb
    .from("products")
    .select("id, name, slug, reference, price, compare_at_price, is_active, is_featured, is_new, gender, category:categories(name), product_images(url, position), product_variants(id, inventory(quantity, low_stock_threshold))")
    .order("created_at", { ascending: false })
    .limit(200);
  if (sp.q) {
    const t = sp.q.replace(/[%,()]/g, " ").trim().slice(0, 60);
    if (t) q = q.or(`name.ilike.%${t}%,reference.ilike.%${t}%`);
  }
  const { data } = await q;
  type Row = { id: string; name: string; slug: string; reference: string; price: number; compare_at_price: number | null; is_active: boolean; is_featured: boolean; is_new: boolean; gender: string; category: { name: string } | null; product_images: { url: string; position: number }[]; product_variants: { id: string; inventory: { quantity: number; low_stock_threshold: number } | null }[] };
  let rows = (data || []) as unknown as Row[];
  const stockOf = (r: Row) => r.product_variants.reduce((a, v) => a + (v.inventory?.quantity ?? 0), 0);
  const low = (r: Row) => r.product_variants.some((v) => (v.inventory?.quantity ?? 0) <= (v.inventory?.low_stock_threshold ?? 2));
  if (sp.stock === "faible") rows = rows.filter(low);

  const Toggle = ({ r, field, label }: { r: Row; field: "is_active" | "is_featured" | "is_new"; label: string }) => (
    <form action={toggleProduct}>
      <input type="hidden" name="id" value={r.id} />
      <input type="hidden" name="field" value={field} />
      <input type="hidden" name="value" value={String(!r[field])} />
      <button className={`text-[0.68rem] uppercase tracking-[0.14em] ${r[field] ? "text-accent" : "text-mist hover:text-ivory"}`}>{label}</button>
    </form>
  );

  return (
    <>
      <PageTitle title="Produits" subtitle={`${rows.length} produit(s)`}>
        <Link href="/admin/produits/nouveau" className="btn btn-primary min-h-11">Ajouter un produit</Link>
      </PageTitle>
      <form className="mb-6 flex flex-wrap gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Nom ou référence" className="field-box w-64" />
        <button className="btn btn-ghost min-h-10 px-4">Rechercher</button>
        <Link href={sp.stock ? "/admin/produits" : "/admin/produits?stock=faible"} className="btn btn-outline min-h-10 px-4">{sp.stock ? "Tous" : "Stock faible"}</Link>
      </form>
      <Card className="overflow-x-auto p-0 md:p-0">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b border-white/[0.1]"><tr className="[&>th]:px-4"><th className={th}>Produit</th><th className={th}>Réf.</th><th className={th}>Catégorie</th><th className={th}>Prix</th><th className={th}>Stock</th><th className={th}>Visibilité</th></tr></thead>
          <tbody className="divide-y divide-white/[0.05]">
            {rows.map((r) => {
              const img = [...r.product_images].sort((a, b) => a.position - b.position)[0];
              const stock = stockOf(r);
              return (
                <tr key={r.id} className="hover:bg-ink-3 [&>td]:px-4">
                  <td className={td}>
                    <Link href={`/admin/produits/${r.id}`} className="flex items-center gap-3 hover:text-accent">
                      <span className="relative h-14 w-11 shrink-0 overflow-hidden bg-ink-3">{img && <Image src={img.url} alt="" fill sizes="44px" className="object-cover" />}</span>
                      {r.name}
                    </Link>
                  </td>
                  <td className={`${td} text-mist`}>{r.reference}</td>
                  <td className={td}>{r.category?.name || "—"}<span className="block text-xs capitalize text-mist">{r.gender}</span></td>
                  <td className={td}>{formatPrice(r.price)}{r.compare_at_price ? <span className="block text-xs text-mist line-through">{formatPrice(r.compare_at_price)}</span> : null}</td>
                  <td className={`${td} ${low(r) ? "text-accent" : ""}`}>{stock}<span className="block text-xs text-mist">{r.product_variants.length} décl.</span></td>
                  <td className={td}><div className="flex flex-col gap-1"><Toggle r={r} field="is_active" label={r.is_active ? "En ligne" : "Masqué"} /><Toggle r={r} field="is_featured" label="Vedette" /><Toggle r={r} field="is_new" label="Nouveauté" /></div></td>
                </tr>
              );
            })}
            {!rows.length && <tr><td colSpan={6} className="p-8 text-center text-mist">Aucun produit. Ajoutez votre premier produit.</td></tr>}
          </tbody>
        </table>
      </Card>
    </>
  );
}
