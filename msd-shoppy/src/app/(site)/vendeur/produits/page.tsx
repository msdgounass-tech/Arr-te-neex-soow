import Image from "next/image";
import Link from "next/link";
import { requireShop } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { EmptyState, Pill } from "@/components/ui/bits";
import { ProductRowActions } from "@/components/seller/ProductRowActions";
import { Icon } from "@/components/ui/Icon";
import { formatPrice } from "@/lib/format";
import { qualityLabel } from "@/lib/quality";
import type { Product, ProductImage } from "@/lib/types";

export const metadata = { title: "Produits" };
const FILTERS = [["", "Tous"], ["publies", "Publiés"], ["brouillons", "Brouillons et masqués"], ["indisponibles", "Indisponibles"], ["a-ameliorer", "À améliorer"]] as const;

export default async function SellerProducts({ searchParams }: { searchParams: Promise<{ filtre?: string; q?: string }> }) {
  const { filtre = "", q = "" } = await searchParams;
  const { shop, canManage } = await requireShop();
  const sb = await supabaseServer();
  let query = sb.from("products").select("*, images:product_images(url, position)").eq("shop_id", shop.id).order("updated_at", { ascending: false });
  if (filtre === "publies") query = query.eq("status", "published");
  if (filtre === "brouillons") query = query.neq("status", "published");
  if (filtre === "indisponibles") query = query.eq("status", "published").or("availability.eq.out_of_stock,stock.eq.0");
  if (filtre === "a-ameliorer") query = query.lt("quality_score", 80);
  if (q.trim()) query = query.ilike("title", `%${q.trim().replace(/[%_]/g, "")}%`);
  const { data } = await query;
  const products = (data ?? []) as (Product & { images: Pick<ProductImage, "url" | "position">[] })[];
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold md:text-3xl">Produits</h1>
        {canManage && <Link href="/vendeur/produits/nouveau" className="btn btn-primary press"><Icon name="plus" size={18} /> Ajouter</Link>}
      </div>
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        {FILTERS.map(([v, l]) => <Link key={v} href={v ? `/vendeur/produits?filtre=${v}` : "/vendeur/produits"} aria-current={filtre === v ? "page" : undefined} className="chip press">{l}</Link>)}
      </div>
      <form className="mb-4"><label htmlFor="pq" className="sr-only">Rechercher un produit</label><input id="pq" name="q" defaultValue={q} placeholder="Rechercher un produit…" className="field max-w-sm" />{filtre && <input type="hidden" name="filtre" value={filtre} />}</form>
      {!products.length ? (
        <EmptyState icon="tag" title={filtre || q ? "Aucun produit pour ce filtre" : "Aucun produit pour le moment"} text={filtre || q ? undefined : "Ajoutez votre premier produit : une photo, un titre, un prix et une catégorie suffisent pour publier."}
          action={canManage && !filtre ? { href: "/vendeur/produits/nouveau", label: "Ajouter un produit" } : undefined} />
      ) : (
        <ul className="space-y-3">{products.map((p) => {
          const img = p.images.sort((a, b) => a.position - b.position)[0];
          const ql = qualityLabel(p.quality_score);
          return (
            <li key={p.id} className="card flex gap-3 p-3">
              <Link href={`/vendeur/produits/${p.id}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-mist">{img ? <Image src={img.url} alt="" fill sizes="80px" className="object-cover" /> : <span className="grid h-full place-items-center text-slate"><Icon name="image" /></span>}</Link>
              <div className="min-w-0 flex-1">
                <Link href={`/vendeur/produits/${p.id}`} className="line-clamp-1 font-medium hover:underline">{p.title}</Link>
                <p className="text-sm"><b>{formatPrice(p.price)}</b>{p.stock != null && <span className="text-slate"> · stock {p.stock}</span>}{p.sku && <span className="text-slate"> · réf. {p.sku}</span>}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Pill tone={p.status === "published" ? "success" : "neutral"}>{p.status === "published" ? "Publié" : p.status === "hidden" ? "Masqué" : "Brouillon"}</Pill>
                  {p.availability === "out_of_stock" || p.stock === 0 ? <Pill tone="danger">Rupture</Pill> : p.availability === "on_order" ? <Pill tone="warning">Sur commande</Pill> : null}
                  <Pill tone={ql.tone}>Qualité {p.quality_score}/100</Pill>
                </div>
                <div className="mt-2"><ProductRowActions id={p.id} status={p.status} canManage={canManage} /></div>
              </div>
            </li>
          );
        })}</ul>
      )}
    </div>
  );
}
