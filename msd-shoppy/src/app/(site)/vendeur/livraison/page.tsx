import { requireShop } from "@/lib/auth";
import { getRegions } from "@/lib/queries";
import { supabaseServer } from "@/lib/supabase/server";
import { ZonesManager } from "@/components/seller/ZonesManager";
import { PageTitle } from "@/components/ui/bits";
import type { DeliveryZone } from "@/lib/types";

export const metadata = { title: "Livraison" };

export default async function DeliveryPage() {
  const { shop, canManage } = await requireShop();
  const sb = await supabaseServer();
  const [{ data }, regions] = await Promise.all([sb.from("shop_delivery_zones").select("*").eq("shop_id", shop.id).eq("active", true).order("created_at"), getRegions()]);
  return (<><PageTitle title="Livraison et retrait" subtitle="Zones, méthodes, frais et délais proposés à vos clients au moment de commander." />
    <ZonesManager zones={(data ?? []) as DeliveryZone[]} regions={regions} canManage={canManage} /></>);
}
