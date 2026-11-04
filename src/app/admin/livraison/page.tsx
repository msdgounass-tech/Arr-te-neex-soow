import { requireRole } from "@/lib/auth";
import { Card, PageTitle } from "@/components/admin/ui";
import { DeliveryOriginForm, ZoneForm } from "@/components/admin/SimpleForms";
import { EMPTY_DELIVERY } from "@/lib/site";

export default async function AdminDelivery() {
  const { sb } = await requireRole("admin");
  const [{ data }, { data: cfg }] = await Promise.all([
    sb.from("delivery_zones").select("*").order("position"),
    sb.from("settings").select("value").eq("key", "delivery").maybeSingle(),
  ]);
  return (
    <>
      <PageTitle title="Livraison" subtitle="Seules les zones actives sont proposées au client. Trois modes : tarif fixe, selon la distance (position GPS du client) ou à confirmer après la commande." />
      <Card className="mb-6">
        <p className="label mb-2">Point de départ des livraisons (pour le calcul selon la distance)</p>
        <p className="mb-4 text-xs text-mist">Distance estimée = distance à vol d&apos;oiseau × coefficient routier (1,3 par défaut). Frais = base + prix/km × distance, arrondis à la centaine.</p>
        <DeliveryOriginForm initial={{ ...EMPTY_DELIVERY, ...((cfg?.value as Record<string, string>) || {}) }} />
      </Card>
      {(data || []).map((z) => (
        <Card key={z.id} className={`mb-3 ${z.is_active ? "" : "opacity-70"}`}><ZoneForm initial={z} /></Card>
      ))}
      <Card className="mt-6"><p className="label mb-4">Nouvelle zone</p><ZoneForm /></Card>
    </>
  );
}
