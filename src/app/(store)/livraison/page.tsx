import type { Metadata } from "next";
import { getDeliveryZones } from "@/lib/queries";
import { formatPrice } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import Link from "next/link";

export const metadata: Metadata = { title: "Livraison", description: "Zones, tarifs et délais de livraison au Sénégal : Dakar et régions. Livraison offerte selon le montant.", alternates: { canonical: "/livraison" } };
export const revalidate = 300;

export default async function DeliveryPage() {
  const zones = await getDeliveryZones();
  return (
    <div className="container-luxe max-w-5xl">
      <PageHeader eyebrow="Aide" title="Livraison" intro="Dakar et toutes les régions du Sénégal. Selon la zone, les frais sont fixes, calculés selon la distance (position partagée lors de la commande) ou confirmés par notre équipe sur WhatsApp avant l'expédition." />
      {zones.length ? (
        <div className="surface overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="label border-b border-white/[0.08]"><tr><th className="px-5 py-4 font-bold md:px-7">Zone</th><th className="font-bold">Délai</th><th className="px-5 text-right font-bold md:px-7">Tarif</th></tr></thead>
          <tbody className="divide-y divide-white/[0.06]">
            {zones.map((z) => (
              <tr key={z.id}>
                <td className="px-5 py-5 text-base font-semibold md:px-7">{z.name}</td>
                <td className="text-mist">{z.delay || "Communiqué à la commande"}</td>
                <td className="px-5 text-right md:px-7">
                  {z.fee_mode === "quote" ? "Communiqué après commande" : z.fee_mode === "distance" ? `${formatPrice(z.fee)} + ${formatPrice(z.per_km_fee)}/km` : z.fee === 0 ? "Offerte" : formatPrice(z.fee)}
                  {z.free_above ? <span className="block text-xs text-accent-light">Offerte dès {formatPrice(z.free_above)}</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      ) : (
        <p className="surface p-8 text-center text-mist">Les tarifs de livraison seront publiés prochainement.</p>
      )}
      <section className="mt-14 grid gap-4 md:grid-cols-2">
        <div className="surface p-6 md:p-8">
          <h2 className="display text-2xl">Paiement</h2>
          <p className="mt-3 text-sm leading-relaxed text-ivory/80">Wave et Orange Money : la commande est confirmée uniquement après vérification effective du paiement. Paiement à la livraison : règlement à la réception de la commande.</p>
        </div>
        <div className="surface p-6 md:p-8">
          <h2 className="display text-2xl">Suivi</h2>
          <p className="mt-3 text-sm leading-relaxed text-ivory/80">Chaque commande reçoit un numéro unique et une page de suivi. Vous êtes informé de l&apos;expédition et de la livraison. <Link href="/suivi" className="text-accent-light hover:underline">Suivre une commande</Link></p>
        </div>
      </section>
    </div>
  );
}
