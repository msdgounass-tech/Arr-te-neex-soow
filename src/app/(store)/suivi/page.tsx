import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPublicSupabase } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Suivre une commande" };

async function track(formData: FormData) {
  "use server";
  const number = String(formData.get("number") || "").trim().toUpperCase().slice(0, 40);
  const phone = String(formData.get("phone") || "").replace(/\D/g, "").slice(-9);
  const sb = getPublicSupabase();
  if (!number || phone.length < 7 || !sb) redirect("/suivi?erreur=1");
  const { data: token } = await sb.rpc("find_order_access", { p_number: number, p_phone: phone });
  if (!token) redirect("/suivi?erreur=1");
  redirect(`/commande/confirmation/${number}?t=${token}`);
}

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const { erreur } = await searchParams;
  return (
    <div className="container-luxe max-w-xl pt-20 md:pt-28">
      <p className="eyebrow text-center">Service client</p>
      <h1 className="display mt-5 text-center text-5xl md:text-6xl">Suivre ma commande</h1>
      <p className="mt-5 text-center text-ivory/90">Saisissez votre numéro de commande et le téléphone utilisé lors de l&apos;achat.</p>
      <form action={track} className="mt-12 space-y-8">
        <label className="block"><span className="label">Numéro de commande</span><input name="number" required placeholder="GL-000000-00000" className="field uppercase tracking-wider" /></label>
        <label className="block"><span className="label">Téléphone</span><input name="phone" type="tel" required className="field" /></label>
        {erreur && <p role="alert" className="text-sm text-danger">Aucune commande ne correspond à ces informations.</p>}
        <button className="btn btn-primary w-full">Afficher ma commande</button>
      </form>
    </div>
  );
}
