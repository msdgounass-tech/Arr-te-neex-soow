import Image from "next/image";
import { requireShop } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { PageTitle, EmptyState } from "@/components/ui/bits";
import { ShareButton, PromoteButton } from "@/components/product/ShareButtons";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Promotion" };

export default async function PromotePage() {
  const { shop } = await requireShop();
  const sb = await supabaseServer();
  const { data } = await sb.from("products").select("id, slug, title, price, images:product_images(url, position)").eq("shop_id", shop.id).eq("status", "published").order("published_at", { ascending: false }).limit(50);
  const products = (data ?? []) as { id: string; slug: string; title: string; price: number; images: { url: string; position: number }[] }[];
  return (
    <div className="space-y-6">
      <PageTitle title="Partager et promouvoir" subtitle="Chaque produit et votre boutique ont un lien direct, avec un aperçu (photo, titre, prix) sur WhatsApp et Facebook." />
      <section className="card p-5">
        <h2 className="font-semibold">Ma boutique</h2>
        <p className="mt-1 text-sm text-slate">/b/{shop.slug}</p>
        <div className="mt-3 flex flex-wrap gap-2"><ShareButton url={`/b/${shop.slug}`} title={shop.name} shopId={shop.id} /><PromoteButton url={`/b/${shop.slug}`} /></div>
      </section>
      <section>
        <h2 className="mb-3 font-semibold">Mes produits publiés</h2>
        {!products.length ? <EmptyState icon="tag" title="Aucun produit publié" action={{ href: "/vendeur/produits/nouveau", label: "Ajouter un produit" }} /> : (
          <ul className="space-y-3">{products.map((p) => {
            const img = p.images.sort((a, b) => a.position - b.position)[0];
            return (<li key={p.id} className="card flex flex-wrap items-center gap-3 p-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-mist">{img && <Image src={img.url} alt="" fill sizes="56px" className="object-cover" />}</div>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{p.title}</p><p className="text-sm text-slate">{formatPrice(p.price)}</p></div>
              <div className="flex gap-2"><ShareButton url={`/p/${p.slug}`} title={p.title} shopId={shop.id} productId={p.id} compact /><PromoteButton url={`/p/${p.slug}`} label="Facebook" /></div>
            </li>);
          })}</ul>
        )}
      </section>
      <p className="rounded-2xl bg-mist p-4 text-sm text-slate">Codes promotionnels, réductions et mise en avant payante arriveront dans une prochaine version. Vous pouvez déjà afficher un ancien prix barré sur chaque produit.</p>
    </div>
  );
}
