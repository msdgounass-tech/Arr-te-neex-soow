import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategories, getProductBySlug, getProducts, getSettings } from "@/lib/queries";
import { formatPrice, sortedImages, toWhatsAppNumber, totalStock } from "@/lib/format";
import { SITE_URL } from "@/lib/env";
import { BRAND } from "@/lib/site";
import { Gallery } from "@/components/product/Gallery";
import { ProductPurchase } from "@/components/product/ProductPurchase";
import { ProductGrid } from "@/components/product/ProductGrid";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ShieldIcon, TruckIcon, WalletIcon } from "@/components/ui/Icons";

export const revalidate = 60;
// Pages générées à la première visite puis mises en cache (ISR), régénérées toutes les 60 s.
export const generateStaticParams = async () => [];
type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  if (!p) return { title: "Produit introuvable" };
  const img = sortedImages(p)[0]?.url;
  const description = p.seo_description || p.description?.slice(0, 160) || `${p.brand ? `${p.brand} ` : ""}${p.name} — ${formatPrice(p.price)}. Livraison au Sénégal.`;
  return {
    title: p.seo_title || [p.brand, p.name].filter(Boolean).join(" "),
    description,
    alternates: { canonical: `/produit/${p.slug}` },
    openGraph: { title: p.name, description, images: img ? [img] : undefined, type: "website" },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [product, categories, { store }] = await Promise.all([getProductBySlug(slug), getCategories(), getSettings()]);
  if (!product) notFound();

  const images = sortedImages(product);
  const parent = product.category?.parent_id ? categories.find((c) => c.id === product.category!.parent_id) || null : null;
  let similar = product.category ? (await getProducts({ categorySlugs: [product.category.slug], excludeId: product.id, limit: 4 })).items : [];
  if (similar.length < 4 && parent) {
    const more = (await getProducts({ categorySlugs: categories.filter((c) => c.parent_id === parent.id).map((c) => c.slug), excludeId: product.id, limit: 8 })).items;
    similar = [...similar, ...more.filter((m) => !similar.some((s) => s.id === m.id))].slice(0, 4);
  }

  const stock = totalStock(product);
  const specs = (product.specs || []).filter((s) => s.label?.trim() && s.value?.trim());
  const url = `${SITE_URL}/produit/${product.slug}`;

  const crumbs = [
    { href: "/", label: "Accueil" },
    ...(parent ? [{ href: `/categorie/${parent.slug}`, label: parent.name }] : [{ href: "/shop", label: "Catalogue" }]),
    ...(product.category ? [{ href: `/categorie/${product.category.slug}`, label: product.category.name }] : []),
  ];

  const prices = product.product_variants.filter((v) => v.is_active).map((v) => v.price_override ?? product.price);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: product.name,
        sku: product.reference,
        description: product.description || undefined,
        image: images.map((i) => i.url),
        ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
        ...(product.category ? { category: product.category.name } : {}),
        ...(specs.length ? { additionalProperty: specs.map((s) => ({ "@type": "PropertyValue", name: s.label, value: s.value })) } : {}),
        offers:
          prices.length > 1 && Math.min(...prices) !== Math.max(...prices)
            ? {
                "@type": "AggregateOffer",
                priceCurrency: "XOF",
                lowPrice: Math.min(...prices),
                highPrice: Math.max(...prices),
                offerCount: prices.length,
                availability: stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              }
            : {
                "@type": "Offer",
                url,
                priceCurrency: "XOF",
                price: product.price,
                availability: stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                itemCondition: "https://schema.org/NewCondition",
                seller: { "@type": "Organization", name: `${BRAND.name} ${BRAND.tagline}` },
              },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [...crumbs, { href: `/produit/${product.slug}`, label: product.name }].map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: c.label,
          item: `${SITE_URL}${c.href === "/" ? "" : c.href}`,
        })),
      },
    ],
  };

  return (
    <div className="container-luxe pt-6 md:pt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label="Fil d'Ariane" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-mist md:mb-8">
        {crumbs.map((c, i) => (
          <span key={c.href} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden>/</span>}
            <Link href={c.href} className="hover:text-white">{c.label}</Link>
          </span>
        ))}
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <Gallery images={images} name={product.name} />
        </div>

        <div className="min-w-0">
          {(product.brand || product.collection) && (
            <div className="flex flex-wrap items-center gap-2">
              {product.brand && <span className="rounded-full border border-white/12 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-ivory/90">{product.brand}</span>}
              {product.collection && (
                <Link href={`/collections/${product.collection.slug}`} className="rounded-full border border-accent/40 px-3 py-1 text-xs font-semibold text-accent-light hover:bg-accent/10">
                  {product.collection.name}
                </Link>
              )}
            </div>
          )}
          <h1 className="display mt-4 text-[2.1rem] leading-[1.05] md:text-5xl">{product.name}</h1>
          <p className="mt-3 text-sm text-mist">
            Réf. {product.reference}
            {product.category ? ` · ${product.category.name}` : ""}
          </p>
          <div className="hairline my-7" />

          <ProductPurchase product={product} whatsapp={toWhatsAppNumber(store.whatsapp)} productUrl={url} />

          <ul className="mt-8 grid gap-2 text-sm sm:grid-cols-3">
            <li className="surface flex items-center gap-2.5 rounded-2xl p-3.5"><TruckIcon width={18} height={18} className="shrink-0 text-accent-light" />Livraison au Sénégal</li>
            <li className="surface flex items-center gap-2.5 rounded-2xl p-3.5"><WalletIcon width={18} height={18} className="shrink-0 text-accent-light" />Wave, OM ou à la livraison</li>
            <li className="surface flex items-center gap-2.5 rounded-2xl p-3.5"><ShieldIcon width={18} height={18} className="shrink-0 text-accent-light" />Échange sous 7 jours</li>
          </ul>

          {product.description && (
            <section className="mt-10" aria-labelledby="description">
              <h2 id="description" className="text-lg font-bold">Description</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-ivory/85">{product.description}</p>
            </section>
          )}

          {specs.length > 0 && (
            <section className="mt-10" aria-labelledby="caracteristiques">
              <h2 id="caracteristiques" className="text-lg font-bold">Caractéristiques techniques</h2>
              <dl className="surface mt-4 divide-y divide-white/[0.06] overflow-hidden">
                {specs.map((s, i) => (
                  <div key={`${s.label}-${i}`} className="grid grid-cols-[minmax(7rem,40%)_1fr] gap-4 px-5 py-3.5 text-sm">
                    <dt className="text-mist">{s.label}</dt>
                    <dd className="font-medium text-ivory">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <div className="mt-10 divide-y divide-white/[0.08] border-y border-white/[0.08]">
            {product.details && (
              <details className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
                  Contenu de la boîte &amp; informations
                  <span className="text-xl text-accent-light transition-transform duration-300 group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ivory/85">{product.details}</p>
              </details>
            )}
            <details className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
                Livraison &amp; paiement
                <span className="text-xl text-accent-light transition-transform duration-300 group-open:rotate-45">+</span>
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-ivory/85">
                Livraison à Dakar et dans les régions du Sénégal : les frais et le délai de votre zone s&apos;affichent au moment de commander.
                Paiement par Wave, Orange Money ou en espèces à la livraison selon disponibilité.{" "}
                <Link href="/livraison" className="text-accent-light underline-offset-4 hover:underline">En savoir plus</Link>
              </p>
            </details>
            <details className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
                Garantie &amp; échange
                <span className="text-xl text-accent-light transition-transform duration-300 group-open:rotate-45">+</span>
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-ivory/85">
                Échange possible sous 7 jours pour un produit non utilisé, complet et dans son emballage d&apos;origine. La garantie applicable à ce produit
                vous est précisée sur demande avant l&apos;achat.{" "}
                <Link href="/garanties" className="text-accent-light underline-offset-4 hover:underline">Conditions détaillées</Link>
              </p>
            </details>
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="pt-20 md:pt-28">
          <SectionHeading eyebrow="Vous aimerez aussi" title="Produits similaires" href={product.category ? `/categorie/${product.category.slug}` : "/shop"} linkLabel="Voir la catégorie" />
          <ProductGrid products={similar} />
        </section>
      )}
    </div>
  );
}
