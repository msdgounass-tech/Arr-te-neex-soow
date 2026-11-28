import { getAiAccess } from "@/lib/ai/access";
import { DataNote, Locked } from "@/components/ai/Locked";
import { ProductCreator } from "@/components/ai/ProductCreator";

export const metadata = { title: "Créer mes produits" };

export default async function CreatePage() {
  const { sb, level, matrix, plan, aiReady, mine } = await getAiAccess();
  if (level("ai_content") === "none") return <Locked feature="ai_content" matrix={matrix} expired={!plan} />;
  const [{ data: products }, { data: cats }] = await Promise.all([
    sb.from("products").select("id, title, description, price").eq("shop_id", mine.shop.id).order("updated_at", { ascending: false }).limit(100),
    sb.from("categories").select("slug, name").eq("domain_id", mine.shop.domain_id)]);
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold">Créer et améliorer mes fiches produits</h2>
      <DataNote>Shoppy AI rédige à partir de votre photo et de vos notes. Il n'invente aucune caractéristique : ce qu'il ne peut pas vérifier apparaît dans « À vérifier ». Vous relisez et publiez vous-même.</DataNote>
      {!aiReady ? <DataNote>La génération par IA n'est pas encore activée sur la plateforme.</DataNote> : (
        <ProductCreator products={(products ?? []) as { id: string; title: string; description: string; price: number }[]}
          categories={Object.fromEntries((cats ?? []).map((c) => [c.slug, c.name]))} canTranslate={level("ai_translate") !== "none"} />)}
    </div>
  );
}
