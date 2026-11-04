import { requireRole } from "@/lib/auth";
import { Card, PageTitle } from "@/components/admin/ui";
import { ZoneForm } from "@/components/admin/SimpleForms";

export default async function AdminDelivery() {
  const { sb } = await requireRole("admin");
  const { data } = await sb.from("delivery_zones").select("*").order("position");
  return (
    <>
      <PageTitle title="Livraison" subtitle="Seules les zones actives sont proposées au client. Renseignez le tarif puis activez la zone." />
      {(data || []).map((z) => (
        <Card key={z.id} className={`mb-3 ${z.is_active ? "" : "opacity-80"}`}><ZoneForm initial={z} /></Card>
      ))}
      <Card className="mt-6"><p className="label mb-4">Nouvelle zone</p><ZoneForm /></Card>
    </>
  );
}
