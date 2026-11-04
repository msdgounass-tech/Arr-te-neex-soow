import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getCollections } from "@/lib/queries";
import { DEFAULT_IMAGES } from "@/lib/site";
import { Reveal } from "@/components/ui/Reveal";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Collections", description: "Les collections et capsules exclusives GOUNASS LUXURY." };
export const revalidate = 60;

export default async function CollectionsPage() {
  const collections = await getCollections();
  return (
    <div className="container-luxe">
      <header className="pb-14 pt-16 text-center md:pt-24">
        <Reveal>
          <p className="eyebrow">Univers</p>
          <h1 className="display mt-5 text-5xl md:text-8xl">Collections</h1>
          <p className="mx-auto mt-6 max-w-xl text-ivory/90">Capsules, éditions exclusives et sélections de saison.</p>
        </Reveal>
      </header>
      <nav aria-label="Sélections" className="mb-12 grid gap-3 sm:grid-cols-3">
        {[
          ["/nouveautes", "Nouvelle collection", "Les dernières arrivées"],
          ["/meilleures-ventes", "Meilleures ventes", "Les pièces les plus convoitées"],
          ["/promotions", "Promotions", "Offres privilèges"],
        ].map(([href, title, sub]) => (
          <Link key={href} href={href} className="group flex items-center justify-between border border-white/[0.12] bg-ink-2/60 px-6 py-6 transition-colors hover:border-gold/60">
            <span>
              <span className="display block text-2xl text-ivory group-hover:text-gold">{title}</span>
              <span className="mt-1 block text-sm text-mist">{sub}</span>
            </span>
            <span aria-hidden className="text-gold transition-transform group-hover:translate-x-1">→</span>
          </Link>
        ))}
      </nav>

      {collections.length ? (
        <div className="grid gap-6 md:grid-cols-2">
          {collections.map((c, i) => (
            <Reveal key={c.id} delay={(i % 2) * 0.1} className={i % 3 === 0 ? "md:col-span-2" : ""}>
              <Link href={`/collections/${c.slug}`} className="group relative block aspect-[4/5] overflow-hidden md:aspect-auto md:h-[70vh]">
                <Image src={c.image_url || DEFAULT_IMAGES.hero} alt={c.name} fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover transition-transform duration-[2000ms] group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                  {c.is_exclusive && <p className="eyebrow">Exclusive</p>}
                  <h2 className="display mt-3 text-5xl md:text-6xl">{c.name}</h2>
                  {c.tagline && <p className="mt-3 text-ivory/90">{c.tagline}</p>}
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      ) : (
        <EmptyState title="Collections en préparation" text="Nos premières collections seront dévoilées très prochainement." cta={{ href: "/shop", label: "Explorer la boutique" }} />
      )}
    </div>
  );
}
