import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { discountPercent, formatPrice, isOnSale, sortedImages, totalStock } from "@/lib/format";
import { FavoriteButton } from "./FavoriteButton";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const images = sortedImages(product);
  const [first, second] = images;
  const stock = totalStock(product);
  const sale = isOnSale(product);
  const colors = Array.from(new Map(product.product_variants.filter((v) => v.color_hex).map((v) => [v.color_hex, v.color])).entries());

  return (
    <article className="group relative">
      <Link href={`/produit/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-ink-3">
          {first ? (
            <>
              <Image
                src={first.url}
                alt={first.alt || product.name}
                fill
                priority={priority}
                sizes="(min-width:1280px) 25vw, (min-width:768px) 33vw, 50vw"
                className="object-cover transition-[transform,opacity] duration-[1400ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.04]"
              />
              {second && (
                <Image
                  src={second.url}
                  alt={second.alt || product.name}
                  fill
                  sizes="(min-width:1280px) 25vw, (min-width:768px) 33vw, 50vw"
                  className="object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                />
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="display text-5xl text-gold/30">GL</span>
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {sale && <span className="bg-gold px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-ink">-{discountPercent(product)} %</span>}
            {product.is_new && !sale && <span className="border border-ivory/40 bg-ink/50 px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.2em] backdrop-blur">Nouveau</span>}
            {stock === 0 && <span className="bg-ink/80 px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.2em] text-mist">Épuisé</span>}
          </div>
          <span className="absolute inset-x-3 bottom-3 translate-y-3 text-center text-[0.78rem] uppercase tracking-[0.3em] text-ivory opacity-0 transition-all duration-700 group-hover:translate-y-0 group-hover:opacity-100">
            Découvrir
          </span>
        </div>
        <div className="mt-4 space-y-1.5 pr-8">
          {product.category && <p className="text-[0.78rem] uppercase tracking-[0.26em] text-mist">{product.category.name}</p>}
          <h3 className="display text-[1.15rem] leading-snug text-ivory transition-colors group-hover:text-gold md:text-xl">{product.name}</h3>
          <p className="flex items-baseline gap-3 text-sm">
            <span className={sale ? "text-gold" : "text-ivory/90"}>{formatPrice(product.price)}</span>
            {sale && <span className="text-xs text-mist line-through">{formatPrice(product.compare_at_price!)}</span>}
          </p>
          {colors.length > 1 && (
            <div className="flex gap-1.5 pt-1" aria-label="Couleurs disponibles">
              {colors.slice(0, 5).map(([hex, name]) => (
                <span key={hex} title={name || ""} className="h-2.5 w-2.5 rounded-full border border-white/20" style={{ background: hex || undefined }} />
              ))}
            </div>
          )}
        </div>
      </Link>
      <FavoriteButton productId={product.id} className="absolute bottom-[3.2rem] right-0 p-1 md:bottom-[3.4rem]" />
    </article>
  );
}
