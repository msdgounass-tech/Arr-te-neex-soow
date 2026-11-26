import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMyShop, requireUser } from "@/lib/auth";
import { getCategories, getDomains, getRegions } from "@/lib/queries";
import { CreateShopForm } from "@/components/seller/CreateShopForm";

export const metadata: Metadata = { title: "Créer ma boutique", robots: { index: false } };

export default async function CreateShopPage() {
  await requireUser("/vendre/creer");
  if (await getMyShop()) redirect("/vendeur");
  const [domains, categories, regions] = await Promise.all([getDomains(), getCategories(), getRegions()]);
  return (
    <div className="container-page max-w-xl py-6 md:py-10">
      <h1 className="text-2xl font-bold md:text-3xl">Créer ma boutique</h1>
      <p className="mb-6 mt-1 text-slate">Trois étapes, quelques minutes. Vous pourrez tout modifier ensuite.</p>
      <CreateShopForm domains={domains} categories={categories} regions={regions} />
    </div>
  );
}
