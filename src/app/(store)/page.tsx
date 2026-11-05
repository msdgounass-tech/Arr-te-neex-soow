import { Hero } from "@/components/home/Hero";
import { ServicesStrip } from "@/components/home/ServicesStrip";
import { CategoryExplorer } from "@/components/home/CategoryExplorer";
import { CategoryRail } from "@/components/home/CategoryRail";
import { GenderSection } from "@/components/home/GenderSection";
import { AccessoriesSection } from "@/components/home/AccessoriesSection";
import { FeaturedCollection } from "@/components/home/FeaturedCollection";
import { Editorial } from "@/components/home/Editorial";
import { NewsletterForm } from "@/components/layout/NewsletterForm";
import { ProductGrid } from "@/components/product/ProductGrid";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";
import { getBestSellers, getCollections, getDeliveryZones, getProducts, getSettings } from "@/lib/queries";
import { commonFreeThreshold, minFreeThreshold } from "@/lib/delivery";
import { DEFAULT_IMAGES } from "@/lib/site";

export const revalidate = 60;
export const metadata = { alternates: { canonical: "/" } };

const MEN = [
  { label: "Vêtements", slug: "homme-vetements" },
  { label: "Chaussures", slug: "homme-chaussures" },
  { label: "Montres", slug: "homme-montres" },
  { label: "Sacs", slug: "homme-sacs" },
  { label: "Lunettes", slug: "homme-lunettes" },
  { label: "Parfums", slug: "homme-parfums" },
];
const WOMEN = [
  { label: "Robes", slug: "femme-robes" },
  { label: "Vêtements", slug: "femme-vetements" },
  { label: "Chaussures", slug: "femme-chaussures" },
  { label: "Sacs", slug: "femme-sacs" },
  { label: "Bijoux", slug: "femme-bijoux" },
  { label: "Parfums", slug: "femme-parfums" },
];

export default async function HomePage() {
  const [{ home }, men, women, news, best, promos, collections] = await Promise.all([
    getSettings(),
    getProducts({ gender: "homme", limit: 4 }),
    getProducts({ gender: "femme", limit: 4 }),
    getProducts({ isNew: true, limit: 8 }),
    getBestSellers(8),
    getProducts({ onSale: true, limit: 8 }),
    getCollections(),
  ]);

  const both = (s: string) => [`homme-${s}`, `femme-${s}`];
  const [zones, watches, shoes, bags, perfumes, jewels, glasses] = await Promise.all([
    getDeliveryZones(),
    getProducts({ categorySlugs: both("montres"), limit: 4 }),
    getProducts({ categorySlugs: both("chaussures"), limit: 4 }),
    getProducts({ categorySlugs: both("sacs"), limit: 4 }),
    getProducts({ categorySlugs: both("parfums"), limit: 4 }),
    getProducts({ categorySlugs: both("bijoux"), limit: 4 }),
    getProducts({ categorySlugs: both("lunettes"), limit: 4 }),
  ]);
  const featured = collections.find((c) => c.is_featured) || null;
  const featuredProducts = featured ? (await getProducts({ collectionSlug: featured.slug, limit: 4 })).items : [];

  const heroImg = home.hero_image || DEFAULT_IMAGES.hero;
  const accImg = home.accessories_image || DEFAULT_IMAGES.accessories;

  return (
    <>
      {/* 1. Bannière */}
      <Hero image={heroImg} logoUrl={home.logo_url} />
      <ServicesStrip freeAbove={commonFreeThreshold(zones) ?? minFreeThreshold(zones)} common={commonFreeThreshold(zones) != null} />

      {/* 2. Collection Homme */}
      <GenderSection
        eyebrow="Homme"
        title="L'assurance, taillée sur mesure."
        text="Costumes structurés, chemises de soie, cuirs et montres : un vestiaire masculin pensé pour les grandes occasions comme pour le quotidien."
        href="/men"
        image={home.men_image || heroImg}
        objectPosition="64% 30%"
        categories={MEN}
        products={men.items}
      />

      {/* 3. Collection Femme */}
      <GenderSection
        reverse
        eyebrow="Femme"
        title="La grâce, en pleine lumière."
        text="Robes fluides, silhouettes affirmées, bijoux et maroquinerie : une garde-robe féminine où chaque détail compte."
        href="/women"
        image={home.women_image || heroImg}
        objectPosition="90% 30%"
        categories={WOMEN}
        products={women.items}
      />

      {/* Exploration par catégorie */}
      <CategoryExplorer />

      {/* 4. Nouveautés */}
      <section className="container-luxe py-20 md:py-28">
        <SectionHeading eyebrow="Nouveautés" title="Les dernières arrivées" href="/nouveautes" />
        {news.items.length ? (
          <ProductGrid products={news.items} />
        ) : (
          <EmptyState title="La collection arrive" text="Les premières pièces sont en cours de sélection. Inscrivez-vous à la newsletter pour être informé de leur mise en ligne." />
        )}
      </section>

      {/* 5. Meilleures ventes (calculées sur les commandes réelles) */}
      {best.length > 0 && (
        <section className="container-luxe py-20 md:py-28">
          <SectionHeading eyebrow="Meilleures ventes" title="Les pièces les plus convoitées" href="/meilleures-ventes" />
          <ProductGrid products={best} />
        </section>
      )}

      {/* 6. Accessoires exclusifs */}
      <AccessoriesSection image={accImg} products={[]} />

      {/* Sections par catégorie */}
      <CategoryRail eyebrow="L'heure GOUNASS" title="Montres" href="/montres" products={watches.items} />
      <CategoryRail tone="soft" eyebrow="Souliers" title="Chaussures" href="/chaussures" products={shoes.items} />
      <CategoryRail eyebrow="Maroquinerie" title="Sacs" href="/accessories?type=sacs" products={bags.items} />
      <CategoryRail tone="soft" eyebrow="Fragrances" title="Parfums" href="/accessories?type=parfums" products={perfumes.items} />
      <CategoryRail eyebrow="Éclat" title="Bijoux" href="/accessories?type=bijoux" products={jewels.items} />
      <CategoryRail tone="soft" eyebrow="Solaires" title="Lunettes" href="/accessories?type=lunettes" products={glasses.items} />

      {/* 7. Collection vedette */}
      {featured && <FeaturedCollection collection={featured} products={featuredProducts} fallbackImage={DEFAULT_IMAGES.collection} />}

      {/* 8. Promotions */}
      {promos.items.length > 0 && (
        <section className="container-luxe py-20 md:py-28">
          <SectionHeading eyebrow="Offres privilèges" title="Promotions" href="/promotions" />
          <ProductGrid products={promos.items} />
        </section>
      )}

      {/* 9. Bannière éditoriale */}
      <Editorial image={home.editorial_image || heroImg} />

      {/* 10. Newsletter */}
      <section className="container-luxe py-20 md:py-28">
        <Reveal className="relative overflow-hidden border border-gold/25 bg-ink-2 px-6 py-16 text-center md:px-16 md:py-24">
          <div className="absolute inset-x-0 top-0 hairline" />
          <p className="eyebrow">Le cercle GOUNASS</p>
          <h2 className="display mt-6 text-4xl md:text-6xl">Avant-premières &amp; invitations</h2>
          <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-mist">
            Recevez en priorité les nouvelles collections, les ventes privées et les codes réservés aux membres.
          </p>
          <div className="mt-10">
            <NewsletterForm variant="section" />
          </div>
        </Reveal>
      </section>
    </>
  );
}
