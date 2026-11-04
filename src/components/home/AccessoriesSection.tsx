import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { Reveal } from "@/components/ui/Reveal";
import { ProductCard } from "@/components/product/ProductCard";
import { ArrowRight } from "@/components/ui/Icons";

const ITEMS = [
  { label: "Montres", q: "montres" },
  { label: "Sacs", q: "sacs" },
  { label: "Lunettes", q: "lunettes" },
  { label: "Parfums", q: "parfums" },
  { label: "Bijoux", q: "bijoux" },
  { label: "Accessoires", q: "accessoires" },
];

export function AccessoriesSection({ image, products }: { image: string; products: Product[] }) {
  return (
    <section className="relative bg-ink-2 py-20 md:py-32">
      <div className="container-luxe grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-24">
        <div className="flex flex-col justify-center">
          <Reveal>
            <p className="eyebrow">Accessoires exclusifs</p>
            <h2 className="display mt-5 text-5xl md:text-7xl">
              Le détail
              <br />
              <em className="text-gold">qui signe tout.</em>
            </h2>
            <p className="mt-6 max-w-md leading-relaxed text-ivory/90">
              Montres, maroquinerie, lunettes, parfums et bijoux : les pièces qui achèvent une silhouette et révèlent une personnalité.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <ul className="mt-12 border-t border-white/[0.08]">
              {ITEMS.map((it, i) => (
                <li key={it.q} className="border-b border-white/[0.08]">
                  <Link href={`/accessories?type=${it.q}`} className="group flex items-center justify-between py-5">
                    <span className="flex items-baseline gap-6">
                      <span className="text-[0.78rem] tracking-[0.2em] text-gold/70">0{i + 1}</span>
                      <span className="display text-3xl transition-all duration-700 group-hover:translate-x-2 group-hover:text-gold md:text-4xl">{it.label}</span>
                    </span>
                    <ArrowRight className="text-ivory/40 transition-all duration-500 group-hover:translate-x-1 group-hover:text-gold" />
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
        <Reveal delay={0.15}>
          <Link href="/accessories" className="group relative block aspect-[4/5] overflow-hidden">
            <Image src={image} alt="Montre, sac, parfum et lunettes GOUNASS LUXURY" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover transition-transform duration-[2200ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-2/70 to-transparent" />
            <span className="absolute bottom-8 left-8 text-[0.74rem] uppercase tracking-[0.32em] text-ivory">Explorer les accessoires</span>
          </Link>
        </Reveal>
      </div>
      {products.length > 0 && (
        <div className="container-luxe mt-20 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
          {products.slice(0, 4).map((p, i) => (
            <Reveal key={p.id} delay={i * 0.08}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}
