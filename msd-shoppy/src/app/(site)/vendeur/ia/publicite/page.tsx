import Link from "next/link";
import { getAiAccess } from "@/lib/ai/access";
import { DataNote, Locked } from "@/components/ai/Locked";
import { AdWriter } from "@/components/ai/AdWriter";

export const metadata = { title: "Mes publicités" };

export default async function AdsPage({ searchParams }: { searchParams: Promise<{ produit?: string }> }) {
  const { produit } = await searchParams;
  const { sb, level, matrix, plan, aiReady, mine } = await getAiAccess();
  if (level("ai_ads") === "none") return <Locked feature="ai_ads" matrix={matrix} expired={!plan} />;
  const { data: products } = await sb.from("products").select("id, title").eq("shop_id", mine.shop.id).eq("status", "published").order("updated_at", { ascending: false }).limit(100);
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold">Conseiller en publicité</h2>
      <DataNote>Shoppy AI rédige vos textes et scripts. Il ne crée ni ne gère de campagne Meta ou Google : aucune connexion à ces plateformes n'est en place.
        Pour choisir quoi promouvoir, regardez <Link href="/vendeur/ia/ventes" className="link">vos produits qui convertissent bien</Link>.</DataNote>
      {!aiReady ? <DataNote>La génération par IA n'est pas encore activée sur la plateforme.</DataNote>
        : <AdWriter products={(products ?? []) as { id: string; title: string }[]} initial={produit} canTranslate={level("ai_translate") !== "none"} />}
    </div>
  );
}
