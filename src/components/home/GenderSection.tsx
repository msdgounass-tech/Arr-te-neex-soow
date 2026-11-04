import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import type { Product } from "@/lib/types";
import { Reveal } from "@/components/ui/Reveal";
import { ProductCard } from "@/components/product/ProductCard";
import { ArrowRight } from "@/components/ui/Icons";

interface Props {
  eyebrow: string;
  title: string;
  text: string;
  href: string;
  image: string;
  objectPosition: string;
  categories: { label: string; slug: string }[];
  products: Product[];
  reverse?: boolean;
}

export function GenderSection({ eyebrow, title, text, href, image, objectPosition, categories, products, reverse }: Props) {
  return (
    <section className="container-luxe py-20 md:py-32">
      <div className={clsx("grid items-center gap-10 lg:grid-cols-2 lg:gap-20", reverse && "lg:[&>*:first-child]:order-2")}>
        <Reveal>
          <Link href={href} className="group relative block aspect-[4/5] overflow-hidden bg-ink-3 lg:aspect-[5/6]">
            <Image
              src={image}
              alt={title}
              fill
              sizes="(min-width:1024px) 50vw, 100vw"
              className="object-cover transition-transform duration-[2000ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-105"
              style={{ objectPosition }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
            <div className="absolute inset-4 border border-gold/0 transition-colors duration-1000 group-hover:border-gold/40 md:inset-6" />
            <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between">
              <span className="display text-5xl md:text-7xl">{eyebrow}</span>
              <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-ivory/40 transition-all duration-700 group-hover:border-gold group-hover:bg-gold group-hover:text-ink">
                <ArrowRight />
              </span>
            </div>
          </Link>
        </Reveal>

        <div>
          <Reveal>
            <p className="eyebrow">Collection {eyebrow}</p>
            <h2 className="display mt-5 text-5xl md:text-7xl">{title}</h2>
            <p className="mt-6 max-w-md leading-relaxed text-ivory/90">{text}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <ul className="mt-10 grid grid-cols-2 gap-x-8 border-t border-white/[0.1] sm:grid-cols-3">
              {categories.map((c) => (
                <li key={c.slug} className="border-b border-white/[0.1]">
                  <Link href={`${href}?categorie=${c.slug}`} className="group flex items-center justify-between py-4 text-[0.78rem] uppercase tracking-[0.24em] text-ivory/90 hover:text-gold">
                    {c.label}
                    <ArrowRight width={14} height={14} className="-translate-x-2 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.2}>
            <Link href={href} className="btn btn-ghost-gold mt-10">Voir la collection {eyebrow.toLowerCase()}</Link>
          </Reveal>
        </div>
      </div>

      {products.length > 0 && (
        <div className="mt-16 grid grid-cols-2 gap-x-4 gap-y-10 md:mt-24 md:grid-cols-4 md:gap-x-6">
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
