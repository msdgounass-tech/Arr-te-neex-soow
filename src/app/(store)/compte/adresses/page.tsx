import type { Metadata } from "next";
import { getProfile, hasRole } from "@/lib/auth";
import { AccountShell } from "@/components/account/AccountShell";
import { AddressForm } from "@/components/account/AddressForm";
import { getDeliveryZones } from "@/lib/queries";
import { deleteAddress, setDefaultAddress } from "../actions";

export const metadata: Metadata = { title: "Mes adresses", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  const { sb, user, profile } = await getProfile();
  const [{ data: addresses }, zones] = await Promise.all([
    sb.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false }).order("created_at"),
    getDeliveryZones(),
  ]);
  return (
    <AccountShell title="Mes adresses" active="/compte/adresses" isStaff={hasRole(profile?.role ?? "customer", "staff")}>
      {addresses && addresses.length > 0 && (
        <ul className="mb-14 grid gap-4 md:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className={`border p-6 ${a.is_default ? "border-gold/50" : "border-white/[0.08]"}`}>
              <div className="flex items-start justify-between gap-3">
                <p className="label">{a.label || "Adresse"}</p>
                {a.is_default && <span className="text-[0.68rem] uppercase tracking-[0.2em] text-gold">Par défaut</span>}
              </div>
              <p className="mt-3">{a.full_name}</p>
              <p className="text-sm text-ivory/90">{a.address_line}</p>
              <p className="text-sm text-ivory/90">{[a.city, a.region].filter(Boolean).join(", ")}</p>
              <p className="text-sm text-mist">{a.phone}</p>
              <div className="mt-5 flex gap-5 text-[0.78rem] uppercase tracking-[0.2em]">
                {!a.is_default && (
                  <form action={setDefaultAddress}><input type="hidden" name="id" value={a.id} /><button className="text-ivory/90 hover:text-gold">Définir par défaut</button></form>
                )}
                <form action={deleteAddress}><input type="hidden" name="id" value={a.id} /><button className="text-mist hover:text-danger">Supprimer</button></form>
              </div>
            </li>
          ))}
        </ul>
      )}
      <h2 className="display mb-8 text-3xl">Ajouter une adresse</h2>
      <AddressForm zones={zones} />
    </AccountShell>
  );
}
