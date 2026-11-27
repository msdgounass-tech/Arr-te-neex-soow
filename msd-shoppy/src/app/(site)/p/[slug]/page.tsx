import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getShopBySlug, getTrustMap, searchProducts } from "@/lib/queries";
import { Gallery } from "@/components/product/Gallery";
import { BuyBox } from "@/components/product/BuyBox";
import { ContactButtons } from "@/components/product/ContactButtons";
import { ShareButton } from "@/components/product/ShareButtons";
import { FavoriteButton } from "@/components/product/FavoriteButton";
import { ProductRail } from "@/components/product/ProductCard";
import { TrustMini } from "@/components/shop/Trust";
import { ShopAvatar } from "@/components/shop/ShopCard";
import { Icon } from "@/components/ui/Icon";
import { formatPrice } from "@/lib/format";
import { SITE } from "@/lib/site";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProductBySlug(slug);
  if (!data) return { title: "Produit introuvable" };
  const { product, images, shop } = data;
  const description = (product.description || `${product.title} chez ${shop.name}`).slice(0, 160);
  return {
    title: `${product.title} — ${formatPrice(product.price)}`,
    description,
    alternates: { canonical: `/p/${product.slug}` },
    openGraph: { title: product.title, description, url: `/p/${product.slug}`, images: images[0] ? [{ url: images[0].url, width: images[0].width || undefined, height: images[0].height || undefined }] : undefined },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getProductBySlug(slug);
  if (!data) notFound();
  const { product, images, variants, shop, category, trust } = data;
  const [shopInfo, similar] = await Promise.all([
    getShopBySlug(shop.slug),
    searchProducts({ category: product.category_id ?? undefined, perPage: 11, sort: "popular" }),
  ]);
  const others = similar.items.filter((p) => p.id !== product.id).slice(0, 10);
  const similarTrust = await getTrustMap(others.map((p) => p.shop.id));
  const url = `${SITE.url}/p/${product.slug}`;
  const waMessage = `Bonjour ${shop.name}, je suis intéressé(e) par « ${product.title} »${product.sku ? ` (réf. ${product.sku})` : ""} à ${formatPrice(product.price)}. ${url}`;
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Product", name: product.title, description: product.description || undefined,
    image: images.map((i) => i.url), sku: product.sku || undefined, category: category?.name,
    brand: { "@type": "Brand", name: shop.name },
    offers: { "@type": "Offer", url, priceCurrency: "XOF", price: product.price,
      availability: product.availability === "out_of_stock" ? "https://schema.org/OutOfStock" : product.availability === "on_order" ? "https://schema.org/PreOrder" : "https://schema.org/InStock",
      seller: { "@type": "Organization", name: shop.name } },
    ...(trust && trust.reviews_count > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: trust.average_rating, reviewCount: trust.reviews_count } } : {}),
  };

  return (
    <div className="container-page py-4 md:py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label="Fil d'Ariane" className="mb-4 flex items-center gap-1 overflow-hidden text-sm text-slate">
        <Link href="/explorer" className="hover:text-ink">Explorer</Link>
        {category && <><Icon name="chevron-right" size={14} /><Link href={`/explorer?categorie=${category.id}`} className="truncate hover:text-ink">{category.name}</Link></>}
      </nav>
      <div className="grid gap-6 md:grid-cols-2 md:gap-10">
        <Gallery images={images} title={product.title} />
        <div>
          <h1 className="text-2xl font-bold leading-tight md:text-3xl">{product.title}</h1>
          {shop.is_demo && <p className="mt-2 inline-flex rounded-full bg-mist px-3 py-1 text-xs font-semibold text-slate">Produit de démonstration</p>}
          <div className="mt-2"><TrustMini trust={trust} shopSlug={shop.slug} /></div>
          <div className="mt-5"><BuyBox product={product} variants={variants} shop={shop} image={images[0]?.url ?? null} /></div>
          <div className="mt-3"><ContactButtons shopId={shop.id} productId={product.id} phone={shop.public_phone} whatsapp={shop.public_whatsapp} message={waMessage} /></div>
          <div className="mt-3 flex gap-2"><FavoriteButton productId={product.id} shopId={shop.id} variant="button" /><ShareButton url={`/p/${product.slug}`} title={product.title} shopId={shop.id} productId={product.id} /></div>

          <Link href={`/b/${shop.slug}`} className="card press mt-6 flex items-center gap-3 p-3">
            <ShopAvatar shop={shop} size={48} />
            <div className="min-w-0 flex-1"><p className="truncate font-semibold">{shop.name}</p>
              <p className="flex items-center gap-1 text-xs text-slate"><Icon name="map-pin" size={12} />{shop.city}, {shop.region}</p></div>
            <span className="text-sm font-semibold text-orange-text">Voir la boutique</span>
          </Link>

          {shopInfo && shopInfo.zones.length > 0 && (
            <section className="mt-6"><h2 className="mb-2 font-semibold">Livraison et retrait</h2>
              <ul className="space-y-2 text-sm">{shopInfo.zones.map((z) => (
                <li key={z.id} className="flex items-start gap-2"><Icon name={z.method === "pickup" ? "store" : "truck"} size={18} className="mt-0.5 text-orange-text" />
                  <span><b>{z.name}</b> — {z.fee == null ? "frais à convenir avec le vendeur" : z.fee === 0 ? "gratuit" : formatPrice(z.fee)}, {z.min_days === z.max_days ? `${z.min_days} j` : `${z.min_days} à ${z.max_days} jours`}
                    {z.regions.length ? <span className="text-slate"> ({z.regions.join(", ")})</span> : null}</span></li>))}</ul>
            </section>
          )}
          <section className="mt-6"><h2 className="mb-2 font-semibold">Description</h2>
            <div className="whitespace-pre-line text-[0.95rem] leading-relaxed text-ink/90">{product.description || "Le vendeur n'a pas encore ajouté de description. Contactez-le pour plus de détails."}</div>
          </section>
          <p className="mt-6 rounded-2xl bg-mist p-4 text-xs text-slate">Le paiement et la livraison se règlent directement avec le vendeur. Une commande passée sur Shoppy by MSD vous permet de suivre son statut et de laisser un avis vérifié.</p>
        </div>
      </div>
      {others.length > 0 && (
        <section className="mt-12"><h2 className="mb-4 text-xl font-bold">Produits similaires</h2><ProductRail items={others} trust={similarTrust} /></section>
      )}
    </div>
  );
}
