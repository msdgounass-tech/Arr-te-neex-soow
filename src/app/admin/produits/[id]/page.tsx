import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { ProductEditor, type EditableProduct } from "@/components/admin/ProductEditor";
import { PageTitle } from "@/components/admin/ui";
import { deleteProduct } from "../../actions";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb } = await requireRole("manager");
  const [{ data: product }, { data: categories }, { data: collections }] = await Promise.all([
    sb.from("products").select("*, product_images(id, url, storage_path, alt, position), product_variants(id, size, color, color_hex, sku, price_override, position, is_active, inventory(quantity))").eq("id", id).maybeSingle(),
    sb.from("categories").select("id, name, slug, parent_id, gender, is_active").order("position"),
    sb.from("collections").select("id, name").order("position"),
  ]);
  if (!product) notFound();
  return (
    <>
      <Link href="/admin/produits" className="text-[0.8rem] uppercase tracking-[0.2em] text-mist hover:text-accent">← Produits</Link>
      <PageTitle title={product.name} subtitle={`Réf. ${product.reference}`}>
        <Link href={`/produit/${product.slug}`} target="_blank" className="btn btn-outline min-h-10">Voir en boutique</Link>
        <form action={deleteProduct}>
          <input type="hidden" name="id" value={product.id} />
          <ConfirmSubmit message="Supprimer définitivement ce produit et ses photos ?" className="btn min-h-10 border border-danger/50 text-danger">Supprimer</ConfirmSubmit>
        </form>
      </PageTitle>
      <ProductEditor product={product as unknown as EditableProduct} categories={categories || []} collections={collections || []} />
    </>
  );
}
