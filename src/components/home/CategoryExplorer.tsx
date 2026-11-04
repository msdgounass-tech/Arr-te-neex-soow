import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const TILES = [
  { label: "Costumes & vestes", sub: "Homme", href: "/men?categorie=homme-vetements", img: "/images/produits/veste-1.svg" },
  { label: "Robes", sub: "Femme", href: "/women?categorie=femme-robes", img: "/images/produits/robe-3.svg" },
  { label: "Montres", sub: "Homme & Femme", href: "/accessories?type=montres", img: "/images/produits/montre-2.svg" },
  { label: "Sacs", sub: "Maroquinerie", href: "/accessories?type=sacs", img: "/images/produits/sac-1.svg" },
  { label: "Chaussures", sub: "Homme & Femme", href: "/chaussures", img: "/images/produits/escarpin-2.svg" },
  { label: "Parfums", sub: "Fragrances", href: "/accessories?type=parfums", img: "/images/produits/parfum-3.svg" },
  { label: "Bijoux", sub: "Or & éclat", href: "/accessories?type=bijoux", img: "/images/produits/bijou-1.svg" },
  { label: "Lunettes", sub: "Solaires", href: "/accessories?type=lunettes", img: "/images/produits/lunettes-2.svg" },
];

export function CategoryExplorer() {
  return (
    <section className="container-luxe py-20 md:py-28">
      <SectionHeading eyebrow="L'univers GOUNASS" title="Explorer par catégorie" href="/shop" linkLabel="Toute la boutique" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
        {TILES.map((t, i) => (
          <Reveal key={t.label} delay={(i % 4) * 0.07}>
            <Link href={t.href} className="group relative block aspect-[3/4] overflow-hidden border border-white/[0.1]">
              <Image src={t.img} alt={t.label} fill unoptimized sizes="(min-width:768px) 25vw, 50vw" className="object-cover transition-transform duration-[1600ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/10 to-transparent" />
              <div className="absolute inset-x-4 bottom-4 md:inset-x-6 md:bottom-6">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-gold-light">{t.sub}</p>
                <p className="display mt-1 text-2xl text-ivory md:text-3xl">{t.label}</p>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
