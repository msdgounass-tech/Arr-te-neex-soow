import { notFound } from "next/navigation";
import Link from "next/link";
import { requireShop } from "@/lib/auth";
import { getCategories, getDomains } from "@/lib/queries";
import { supabaseServer } from "@/lib/supabase/server";
import { ProductForm } from "@/components/seller/ProductForm";
import { PageTitle } from "@/components/ui/bits";
import type { Product, ProductImage, ProductVariant } from "@/lib/types";

export const metadata = { title: "Modifier le produit" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { shop, canManage } = await requireShop();
  const sb = await supabaseServer();
  const [{ data }, domains, categories] = await Promise.all([
    sb.from("products").select("*, images:product_images(*), variants:product_variants(*)").eq("id", id).eq("shop_id", shop.id).maybeSingle(),
    getDomains(), getCategories()]);
  if (!data) notFound();
  const { images, variants, ...product } = data as Product & { images: ProductImage[]; variants: ProductVariant[] };
  return (<><PageTitle title={product.title} back="/vendeur/produits"
      action={product.status === "published" ? <Link href={`/p/${product.slug}`} className="link shrink-0 text-sm">Voir la fiche</Link> : undefined} />
    <ProductForm product={product as Product} images={images.sort((a, b) => a.position - b.position)} variants={variants.sort((a, b) => a.position - b.position)}
      domains={domains} categories={categories} canManage={canManage} firstProduct={false} /></>);
}
