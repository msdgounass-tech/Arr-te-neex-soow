import Link from "next/link";
import { requireShop } from "@/lib/auth";
import { getCategories, getDomains, getRegions } from "@/lib/queries";
import { supabaseServer } from "@/lib/supabase/server";
import { ShopEditForm } from "@/components/seller/ShopEditForm";
import { PageTitle } from "@/components/ui/bits";

export const metadata = { title: "Ma boutique" };

export default async function ShopSettingsPage() {
  const { shop, canManage } = await requireShop();
  const sb = await supabaseServer();
  const [domains, categories, regions, { data: specs }] = await Promise.all([getDomains(), getCategories(), getRegions(),
    sb.from("shop_specialties").select("category_id").eq("shop_id", shop.id)]);
  return (<><PageTitle title="Ma boutique" action={<Link href={`/b/${shop.slug}`} className="link shrink-0 text-sm">Voir la page publique</Link>} />
    <ShopEditForm shop={shop} domains={domains} categories={categories} regions={regions} canManage={canManage}
      specialties={((specs ?? []) as { category_id: number }[]).map((s) => s.category_id)} /></>);
}
