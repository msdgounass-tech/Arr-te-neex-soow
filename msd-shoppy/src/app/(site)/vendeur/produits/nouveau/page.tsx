import { requireShop } from "@/lib/auth";
import { getCategories, getDomains } from "@/lib/queries";
import { supabaseServer } from "@/lib/supabase/server";
import { ProductForm } from "@/components/seller/ProductForm";
import { PageTitle } from "@/components/ui/bits";

export const metadata = { title: "Nouveau produit" };

export default async function NewProductPage() {
  const { shop, canManage } = await requireShop();
  const sb = await supabaseServer();
  const [domains, categories, { count }] = await Promise.all([getDomains(), getCategories(),
    sb.from("products").select("id", { count: "exact", head: true }).eq("shop_id", shop.id).eq("status", "published")]);
  return (<><PageTitle title="Nouveau produit" back="/vendeur/produits" />
    <ProductForm product={null} images={[]} variants={[]} domains={domains} categories={categories} canManage={canManage} firstProduct={!count} /></>);
}
