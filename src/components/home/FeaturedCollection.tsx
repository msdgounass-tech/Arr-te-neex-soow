import Image from "next/image";
import Link from "next/link";
import type { Collection, Product } from "@/lib/types";
import { Reveal } from "@/components/ui/Reveal";
import { ProductCard } from "@/components/product/ProductCard";

export function FeaturedCollection({ collection, products, fallbackImage }: { collection: Collection; products: Product[]; fallbackImage: string }) {
  const href = `/collections/${collection.slug}`;
  return (
    <section className="py-20 md:py-32">
      <Link href={href} className="group relative mx-4 block h-[70vh] min-h-[480px] overflow-hidden rounded-[2rem] border border-white/[0.08] md:mx-10">
        <Image
          src={collection.image_url || fallbackImage}
          alt={collection.name}
          fill
          sizes="100vw"
          className={`${!collection.image_url && fallbackImage.endsWith(".svg") ? "object-contain object-top md:object-cover md:object-center" : "object-cover"} transition-transform duration-[2400ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.03]`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-ink/30" />
        <div className="container-luxe relative flex h-full flex-col items-center justify-end pb-16 text-center md:pb-24">
          <Reveal>
            <p className="eyebrow">Collection vedette{collection.is_exclusive ? " · Exclusive" : ""}</p>
            <h2 className="display mt-5 text-5xl md:text-8xl">{collection.name}</h2>
            {collection.tagline && <p className="mt-5 text-lg text-ivory/85 md:text-xl">{collection.tagline}</p>}
            <span className="btn btn-outline mt-10">Découvrir la collection</span>
          </Reveal>
        </div>
      </Link>
      {products.length > 0 && (
        <div className="container-luxe mt-12 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {products.slice(0, 4).map((p, i) => (
            <Reveal key={p.id} delay={i * 0.08} className="h-full">
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}
