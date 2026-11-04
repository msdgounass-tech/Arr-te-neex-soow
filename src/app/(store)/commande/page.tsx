import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { getDeliveryZones, getSettings } from "@/lib/queries";
import { paymentModes } from "@/lib/payments/config";
import { getServerSupabase } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Commande", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [zones, settings] = await Promise.all([getDeliveryZones(), getSettings()]);
  const modes = paymentModes(settings.payments);
  const o = settings.delivery;
  const origin = o.origin_lat && o.origin_lng ? { lat: Number(o.origin_lat), lng: Number(o.origin_lng), factor: Number(o.road_factor) || 1.3 } : null;
  const sb = await getServerSupabase();
  let prefill: Record<string, string> = {};
  let loggedIn = false;
  if (sb) {
    const { data: { user } } = await sb.auth.getUser();
    if (user) {
      loggedIn = true;
      const [{ data: profile }, { data: address }] = await Promise.all([
        sb.from("profiles").select("full_name, phone, whatsapp, email").eq("id", user.id).maybeSingle(),
        sb.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false }).limit(1).maybeSingle(),
      ]);
      prefill = {
        customer_name: address?.full_name || profile?.full_name || "",
        email: profile?.email || user.email || "",
        phone: address?.phone || profile?.phone || "",
        whatsapp: profile?.whatsapp || "",
        address_line: address?.address_line || "",
        city: address?.city || "",
        region: address?.region || "",
        zone_id: address?.zone_id || "",
      };
    }
  }
  return <CheckoutForm zones={zones} modes={modes} origin={origin} prefill={prefill} loggedIn={loggedIn} />;
}
