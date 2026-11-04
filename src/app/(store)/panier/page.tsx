import type { Metadata } from "next";
import { CartView } from "@/components/checkout/CartView";
import { getDeliveryZones } from "@/lib/queries";
import { commonFreeThreshold, minFreeThreshold } from "@/lib/delivery";

export const metadata: Metadata = { title: "Panier", robots: { index: false } };
export const revalidate = 60;

export default async function CartPage() {
  const zones = await getDeliveryZones();
  const common = commonFreeThreshold(zones);
  return <CartView freeAbove={common ?? minFreeThreshold(zones)} freeEverywhere={common != null} />;
}
