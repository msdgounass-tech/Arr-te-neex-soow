import type { Metadata } from "next";
import { getUser } from "@/lib/auth";
import { PageTitle } from "@/components/ui/bits";
import { TicketForm } from "@/components/account/TicketForm";

export const metadata: Metadata = { title: "Signaler un problème" };

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const [{ page }, user] = await Promise.all([searchParams, getUser()]);
  return (
    <div className="container-page max-w-xl py-6 md:py-10">
      <PageTitle title="Signaler un problème" subtitle="Une commande, un vendeur, un produit ou un souci technique : l'équipe vous répond par e-mail." back="/aide" />
      <TicketForm email={user?.email ?? ""} page={page ?? ""} />
    </div>
  );
}
