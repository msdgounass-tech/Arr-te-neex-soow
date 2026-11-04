import type { Metadata } from "next";
import { getDeliveryZones } from "@/lib/queries";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Livraison", description: "Zones, tarifs et délais de livraison GOUNASS LUXURY." };
export const revalidate = 300;

export default async function DeliveryPage() {
  const zones = await getDeliveryZones();
  return (
    <div className="container-luxe max-w-4xl pt-16 md:pt-24">
      <p className="eyebrow text-center">Service</p>
      <h1 className="display mt-5 text-center text-5xl md:text-7xl">Livraison</h1>
      <p className="mx-auto mt-6 max-w-xl text-center text-ivory/90">Tarifs et délais par zone. Selon la zone, les frais sont fixes, calculés selon la distance (position partagée lors de la commande) ou confirmés par notre équipe sur WhatsApp avant l&apos;expédition.</p>
      {zones.length ? (
        <table className="mt-14 w-full text-left text-sm">
          <thead className="label border-b border-white/[0.08]"><tr><th className="py-3 font-normal">Zone</th><th className="font-normal">Délai</th><th className="text-right font-normal">Tarif</th></tr></thead>
          <tbody className="divide-y divide-white/[0.06]">
            {zones.map((z) => (
              <tr key={z.id}>
                <td className="display py-5 text-xl">{z.name}</td>
                <td className="text-mist">{z.delay || "—"}</td>
                <td className="text-right">
                  {z.fee_mode === "quote" ? "Communiqué après commande" : z.fee_mode === "distance" ? `${formatPrice(z.fee)} + ${formatPrice(z.per_km_fee)}/km` : z.fee === 0 ? "Offerte" : formatPrice(z.fee)}
                  {z.free_above ? <span className="block text-xs text-gold">Offerte dès {formatPrice(z.free_above)}</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="mt-14 text-center text-mist">Les tarifs de livraison seront publiés prochainement.</p>
      )}
      <div className="mt-16 space-y-4 text-sm leading-relaxed text-ivory/90">
        <h2 className="display text-3xl text-ivory">Paiement</h2>
        <p>Wave, Orange Money et carte bancaire : la commande est confirmée uniquement après vérification effective du paiement. Paiement à la livraison : règlement à la réception de la commande.</p>
      </div>
    </div>
  );
}
