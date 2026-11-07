import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { discountPercent, formatPrice, isOnSale, sortedImages, totalStock } from "@/lib/format";
import { Spotlight } from "@/components/ui/Spotlight";
import { Emblem } from "@/components/brand/Logo";
import { FavoriteButton } from "./FavoriteButton";
import { QuickAdd } from "./QuickAdd";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const images = sortedImages(product);
  const [first, second] = images;
  const stock = totalStock(product);
  const sale = isOnSale(product);
  const active = product.product_variants.filter((v) => v.is_active);
  const single = active.length === 1 ? active[0] : null;
  const colors = Array.from(new Map(active.filter((v) => v.color_hex).map((v) => [v.color_hex, v.color])).entries());

  return (
    <Spotlight className="surface group relative flex h-full flex-col overflow-hidden transition-[border-color,transform,box-shadow] duration-700 ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_30px_80px_-40px_rgba(126,164,255,.45)]">
      <Link href={`/produit/${product.slug}`} className="relative z-[2] flex flex-1 flex-col">
        <div className="relative aspect-square overflow-hidden bg-[radial-gradient(80%_70%_at_50%_40%,rgba(255,255,255,.07),transparent_70%)]">
          {first ? (
            <>
              <Image
                src={first.url}
                alt={first.alt || product.name}
                fill
                priority={priority}
                sizes="(min-width:1280px) 22vw, (min-width:768px) 30vw, 46vw"
                className="object-contain p-5 transition-[transform,opacity] duration-[1200ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.06] md:p-7"
              />
              {second && (
                <Image
                  src={second.url}
                  alt=""
                  fill
                  sizes="(min-width:1280px) 22vw, (min-width:768px) 30vw, 46vw"
                  className="object-contain p-5 opacity-0 transition-opacity duration-700 group-hover:opacity-100 md:p-7"
                />
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <Emblem className="h-16 w-16 opacity-40" />
            </div>
          )}
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {sale && <span className="rounded-full bg-accent px-2.5 py-1 text-[0.72rem] font-bold text-ink">-{discountPercent(product)} %</span>}
            {product.is_new && !sale && <span className="rounded-full border border-white/20 bg-ink/60 px-2.5 py-1 text-[0.72rem] font-semibold backdrop-blur">Nouveau</span>}
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-4 pt-3 md:p-5 md:pt-4">
          <p className="truncate text-[0.74rem] font-semibold uppercase tracking-[0.12em] text-mist">
            {product.brand || product.category?.name || " "}
          </p>
          <h3 className="line-clamp-2 text-[0.98rem] font-semibold leading-snug text-ivory md:text-[1.05rem]">{product.name}</h3>
          <div className="mt-auto flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 pt-2">
            <span className={`whitespace-nowrap text-[1.02rem] font-bold ${sale ? "text-accent-light" : "text-ivory"}`}>{formatPrice(product.price)}</span>
            {sale && <span className="whitespace-nowrap text-xs text-mist line-through">{formatPrice(product.compare_at_price!)}</span>}
          </div>
          <div className="flex items-center justify-between gap-2 pr-10 text-[0.76rem]">
            <span className={`inline-flex items-center gap-1.5 ${stock > 0 ? "text-success" : "text-mist"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${stock > 0 ? "bg-success shadow-[0_0_8px_rgba(95,215,161,.9)]" : "bg-mist"}`} />
              {stock > 0 ? (stock <= 3 ? `Plus que ${stock}` : "En stock") : "Épuisé"}
            </span>
            {colors.length > 1 && (
              <span className="flex gap-1" aria-label={`${colors.length} coloris`}>
                {colors.slice(0, 4).map(([hex, name]) => (
                  <span key={hex} title={name || ""} className="h-3 w-3 rounded-full border border-white/25" style={{ background: hex || undefined }} />
                ))}
              </span>
            )}
          </div>
        </div>
      </Link>
      <FavoriteButton productId={product.id} className="absolute right-2.5 top-2.5 z-[3] rounded-full bg-ink/50 p-2 backdrop-blur" />
      <div className="absolute bottom-3.5 right-3.5 z-[3] md:bottom-4 md:right-4">
        <QuickAdd product={product} variantId={single && (single.inventory?.quantity ?? 0) > 0 ? single.id : null} disabled={stock === 0} />
      </div>
    </Spotlight>
  );
}
