import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { CatalogPage, type SearchParams } from "@/components/catalog/CatalogPage";
import { WATCH_STYLES } from "@/lib/catalog-options";

export const metadata: Metadata = {
  title: "Montres",
  description: "Montres de luxe GOUNASS LUXURY pour homme et femme : classiques, sportives, connectées et pièces d'exception. Livraison au Sénégal.",
  alternates: { canonical: "/montres" },
};

const TILES = [
  { label: "Montres Hommes", href: "/montres?genre=homme", key: "genre:homme", img: "/images/produits/montre-1.svg" },
  { label: "Montres Femmes", href: "/montres?genre=femme", key: "genre:femme", img: "/images/produits/montre-3.svg" },
  { label: "Montres Connectées", href: "/montres?style=connectee", key: "style:connectee", img: "/images/produits/montre-2.svg" },
  { label: "Montres de Luxe", href: "/montres?style=luxe", key: "style:luxe", img: "/images/produits/montre-1.svg" },
  { label: "Montres Classiques", href: "/montres?style=classique", key: "style:classique", img: "/images/produits/montre-3.svg" },
  { label: "Montres Sportives", href: "/montres?style=sportive", key: "style:sportive", img: "/images/produits/montre-2.svg" },
];

export default async function WatchesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const active = sp.style ? `style:${sp.style}` : sp.genre ? `genre:${sp.genre}` : "";
  return (
    <CatalogPage
      eyebrow="L'heure GOUNASS"
      title="Montres"
      intro="Des garde-temps choisis pour leur caractère : classiques intemporelles, sportives affirmées, pièces de luxe et montres connectées."
      basePath="/montres"
      base={{ categorySlugs: ["homme-montres", "femme-montres"] }}
      searchParams={sp}
      categories={WATCH_STYLES}
      categoryParam="style"
      filterKind="tag"
    >
      <nav aria-label="Catégories de montres" className="mb-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {TILES.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            aria-current={active === t.key ? "page" : undefined}
            className={clsx(
              "group relative block aspect-[4/5] overflow-hidden border transition-colors",
              active === t.key ? "border-gold" : "border-white/[0.12] hover:border-gold/60",
            )}
          >
            <Image src={t.img} alt="" fill sizes="(min-width:1024px) 16vw, (min-width:640px) 33vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
            <span className="display absolute inset-x-3 bottom-3 text-lg leading-tight text-ivory md:text-xl">{t.label}</span>
          </Link>
        ))}
      </nav>
    </CatalogPage>
  );
}
