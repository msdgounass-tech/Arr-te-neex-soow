import type { Metadata } from "next";
import { CheckoutForm } from "@/components/cart/CheckoutForm";
import { getProfile, requireUser } from "@/lib/auth";
import { getRegions } from "@/lib/queries";
import { supabaseServer } from "@/lib/supabase/server";
import type { Address } from "@/lib/types";

export const metadata: Metadata = { title: "Commander", robots: { index: false } };

export default async function CheckoutPage() {
  await requireUser("/commande");
  const sb = await supabaseServer();
  const [profile, regions, { data: addresses }] = await Promise.all([getProfile(), getRegions(), sb.from("addresses").select("*").order("is_default", { ascending: false })]);
  return (
    <div className="container-page py-6 md:py-10">
      <h1 className="mb-6 text-2xl font-bold md:text-3xl">Commander</h1>
      <CheckoutForm regions={regions} addresses={(addresses ?? []) as Address[]} defaultName={profile?.full_name ?? ""} defaultPhone={profile?.phone ?? ""} />
    </div>
  );
}
