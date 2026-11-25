import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { getRegions } from "@/lib/queries";
import { PageTitle } from "@/components/ui/bits";
import { AddressManager } from "@/components/account/AddressManager";
import type { Address } from "@/lib/types";

export const metadata: Metadata = { title: "Adresses", robots: { index: false } };

export default async function AddressesPage() {
  await requireUser("/compte/adresses");
  const sb = await supabaseServer();
  const [{ data }, regions] = await Promise.all([sb.from("addresses").select("*").order("is_default", { ascending: false }).order("created_at"), getRegions()]);
  return <div className="container-page max-w-xl py-6 md:py-10"><PageTitle title="Adresses" back="/compte" /><AddressManager addresses={(data ?? []) as Address[]} regions={regions} /></div>;
}
