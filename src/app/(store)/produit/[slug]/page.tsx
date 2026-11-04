import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getProducts } from "@/lib/queries";
import { formatPrice, sortedImages, totalStock } from "@/lib/format";
import { SITE_URL } from "@/lib/env";
import { Gallery } from "@/components/product/Gallery";
import { ProductPurchase } from "@/components/product/ProductPurchase";
import { ProductGrid } from "@/components/product/ProductGrid";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const revalidate = 60;
type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  if (!p) return { title: "Produit introuvable" };
  const img = sortedImages(p)[0]?.url;
  const description = p.seo_description || p.description?.slice(0, 160) || `${p.name} — ${formatPrice(p.price)}`;
  return {
    title: p.seo_title || p.name,
    description,
    alternates: { canonical: `/produit/${p.slug}` },
    openGraph: { title: p.name, description, images: img ? [img] : undefined },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const images = sortedImages(product);
  const similar = product.category_id
    ? (await getProducts({ categorySlugs: product.category ? [product.category.slug] : undefined, excludeId: product.id, limit: 4 })).items
    : (await getProducts({ gender: product.gender === "unisexe" ? undefined : product.gender, excludeId: product.id, limit: 4 })).items;

  const genderHref = product.gender === "homme" ? "/men" : product.gender === "femme" ? "/women" : "/shop";
  const genderLabel = product.gender === "homme" ? "Homme" : product.gender === "femme" ? "Femme" : "Shop";
  const stock = totalStock(product);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.reference,
    description: product.description || undefined,
    image: images.map((i) => i.url),
    brand: { "@type": "Brand", name: "GOUNASS LUXURY" },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/produit/${product.slug}`,
      priceCurrency: "XOF",
      price: product.price,
      availability: stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="container-luxe pt-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label="Fil d'Ariane" className="mb-8 flex flex-wrap gap-2 text-[0.8rem] uppercase tracking-[0.22em] text-mist">
        <Link href="/" className="hover:text-ivory">Accueil</Link>/
        <Link href={genderHref} className="hover:text-ivory">{genderLabel}</Link>
        {product.category && (
          <>
            /<Link href={`${genderHref}?categorie=${product.category.slug}`} className="hover:text-ivory">{product.category.name}</Link>
          </>
        )}
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-20">
        <Gallery images={images} name={product.name} />

        <div className="lg:sticky lg:top-28 lg:self-start">
          {product.collection && (
            <Link href={`/collections/${product.collection.slug}`} className="eyebrow hover:text-ivory">
              {product.collection.name}
            </Link>
          )}
          <h1 className="display mt-4 text-4xl leading-tight md:text-6xl">{product.name}</h1>
          <p className="mt-4 text-[0.8rem] uppercase tracking-[0.26em] text-mist">
            Réf. {product.reference}
            {product.category ? ` · ${product.category.name}` : ""}
          </p>
          <div className="hairline my-8" />

          <ProductPurchase product={product} />

          {product.description && (
            <div className="mt-12 border-t border-white/[0.1] pt-8">
              <p className="label mb-4">Description</p>
              <p className="whitespace-pre-line leading-relaxed text-ivory/90">{product.description}</p>
            </div>
          )}
          {product.details && (
            <details className="group mt-6 border-t border-white/[0.1] pt-6">
              <summary className="label flex cursor-pointer list-none items-center justify-between">
                Détails &amp; entretien <span className="text-gold transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ivory/90">{product.details}</p>
            </details>
          )}
          <details className="group mt-6 border-y border-white/[0.1] py-6">
            <summary className="label flex cursor-pointer list-none items-center justify-between">
              Livraison &amp; paiement <span className="text-gold transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-4 text-sm leading-relaxed text-ivory/90">
              Livraison à Dakar, dans les régions du Sénégal et à l&apos;international — tarifs et délais affichés lors de la commande.
              Paiement par Wave, Orange Money, carte bancaire ou à la livraison selon disponibilité.{" "}
              <Link href="/livraison" className="text-gold underline-offset-4 hover:underline">En savoir plus</Link>
            </p>
          </details>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="pt-28">
          <SectionHeading eyebrow="Vous aimerez aussi" title="Produits similaires" />
          <ProductGrid products={similar} />
        </section>
      )}
    </div>
  );
}
