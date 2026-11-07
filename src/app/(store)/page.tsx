import { Hero } from "@/components/home/Hero";
import { UniverseGrid } from "@/components/home/UniverseGrid";
import { Commitments } from "@/components/home/Commitments";
import { CategoryRail } from "@/components/home/CategoryRail";
import { FeaturedCollection } from "@/components/home/FeaturedCollection";
import { WhatsAppBand } from "@/components/home/WhatsAppBand";
import { NewsletterForm } from "@/components/layout/NewsletterForm";
import { ProductGrid } from "@/components/product/ProductGrid";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";
import { getBestSellers, getCategoryCounts, getCategoryTree, getCollections, getDeliveryZones, getProducts, getSettings } from "@/lib/queries";
import { commonFreeThreshold, minFreeThreshold } from "@/lib/delivery";
import { formatPrice, toWhatsAppNumber } from "@/lib/format";
import { DEFAULT_IMAGES } from "@/lib/site";

export const revalidate = 60;
export const metadata = { alternates: { canonical: "/" } };

export default async function HomePage() {
  const [{ store }, tree, counts, news, best, promos, collections, zones] = await Promise.all([
    getSettings(),
    getCategoryTree(),
    getCategoryCounts(),
    getProducts({ isNew: true, limit: 8 }),
    getBestSellers(8),
    getProducts({ onSale: true, limit: 8 }),
    getCollections(),
    getDeliveryZones(),
  ]);

  // Un rayon par univers qui contient des produits en ligne
  const rails = await Promise.all(
    tree
      .filter((u) => (counts[u.slug] ?? 0) > 0)
      .map(async (u) => ({ universe: u, items: (await getProducts({ categorySlugs: [u.slug, ...u.children.map((c) => c.slug)], limit: 4 })).items })),
  );

  const featured = collections.find((c) => c.is_featured) || null;
  const featuredProducts = featured ? (await getProducts({ collectionSlug: featured.slug, limit: 4 })).items : [];

  const common = commonFreeThreshold(zones);
  const free = common ?? minFreeThreshold(zones);
  const freeLabel = free ? formatPrice(free) : null;
  const whatsapp = toWhatsAppNumber(store.whatsapp);

  return (
    <>
      <Hero whatsapp={whatsapp} freeAbove={common != null ? freeLabel : null} />

      <UniverseGrid tree={tree} counts={counts} />

      <section className="container-luxe py-16 md:py-24" aria-labelledby="nouveautes">
        <SectionHeading eyebrow="Nouveautés" title="Les dernières arrivées" href="/nouveautes" id="nouveautes" />
        {news.items.length ? (
          <ProductGrid products={news.items} />
        ) : (
          <EmptyState
            title="Le catalogue arrive"
            text="Les premiers produits sont en cours de mise en ligne. Écrivez-nous sur WhatsApp pour connaître les disponibilités, ou inscrivez-vous pour être prévenu."
            cta={{ href: "/contact", label: "Nous contacter" }}
          />
        )}
      </section>

      {best.length > 0 && (
        <section className="container-luxe py-16 md:py-24" aria-labelledby="meilleures-ventes">
          <SectionHeading eyebrow="Meilleures ventes" title="Les plus demandés" href="/meilleures-ventes" id="meilleures-ventes" />
          <ProductGrid products={best} />
        </section>
      )}

      <Commitments freeAbove={freeLabel} common={common != null} />

      {promos.items.length > 0 && (
        <section className="container-luxe py-16 md:py-24" aria-labelledby="offres">
          <SectionHeading eyebrow="Offres du moment" title="Promotions" href="/promotions" id="offres" />
          <ProductGrid products={promos.items} />
        </section>
      )}

      {rails.map(({ universe, items }, i) => (
        <CategoryRail key={universe.slug} tone={i % 2 ? "soft" : "plain"} eyebrow="Univers" title={universe.name} href={`/categorie/${universe.slug}`} products={items} />
      ))}

      {featured && <FeaturedCollection collection={featured} products={featuredProducts} fallbackImage={DEFAULT_IMAGES.collection} />}

      <WhatsAppBand whatsapp={whatsapp} />

      <section className="container-luxe pb-8 pt-4 md:pb-16">
        <Reveal className="surface relative overflow-hidden px-6 py-14 text-center md:px-16 md:py-20">
          <div aria-hidden className="absolute inset-x-0 top-0 hairline" />
          <p className="eyebrow">Newsletter</p>
          <h2 className="display mt-4 text-[2rem] sm:text-5xl">Nouveautés et offres en avant-première</h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-mist">
            Recevez les arrivages, les promotions et les codes réservés aux abonnés. Désinscription en un clic.
          </p>
          <div className="mx-auto mt-8 max-w-md">
            <NewsletterForm variant="section" />
          </div>
        </Reveal>
      </section>
    </>
  );
}
