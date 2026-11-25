import Link from "next/link";
import type { ProductCardData, Trust } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { FadeImage } from "@/components/motion/FadeImage";
import { FavoriteButton } from "./FavoriteButton";
import { Icon } from "@/components/ui/Icon";

export function ProductCard({ p, trust, priority = false }: { p: ProductCardData; trust?: Trust; priority?: boolean }) {
  const discount = p.compare_at_price && p.compare_at_price > p.price ? Math.round((1 - p.price / p.compare_at_price) * 100) : 0;
  return (
    <article className="card-interactive group rounded-2xl">
      <Link href={`/p/${p.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-mist">
          {p.image ? (
            <FadeImage src={p.image.url} alt={p.title} fill sizes="(min-width: 1024px) 22vw, (min-width: 768px) 30vw, 48vw"
              priority={priority} className="card-zoom object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-slate"><Icon name="image" size={32} /></div>
          )}
          {discount > 0 && <span className="absolute left-2 top-2 rounded-full bg-orange-strong px-2 py-1 text-xs font-bold text-white">−{discount} %</span>}
          {p.availability === "out_of_stock" && <span className="absolute inset-x-2 bottom-2 rounded-full bg-white/95 py-1 text-center text-xs font-semibold">Rupture de stock</span>}
          {p.availability === "on_order" && <span className="absolute inset-x-2 bottom-2 rounded-full bg-white/95 py-1 text-center text-xs font-semibold">Sur commande</span>}
        </div>
        <div className="px-1 pb-1 pt-2.5">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug">{p.title}</h3>
          <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
            <span className="font-display text-base font-bold">{formatPrice(p.price)}</span>
            {discount > 0 && <s className="text-xs text-slate">{formatPrice(p.compare_at_price)}</s>}
          </p>
          <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate">
            <span className="truncate">{p.shop.name}</span>
            {trust && trust.reviews_count > 0 && trust.average_rating != null && (
              <span className="inline-flex shrink-0 items-center gap-0.5 text-ink"><Icon name="star" size={12} filled className="text-orange" />{trust.average_rating}</span>
            )}
            {trust?.verified && <Icon name="badge" size={13} className="shrink-0 text-success" title="Boutique vérifiée" />}
          </p>
        </div>
      </Link>
      <FavoriteButton productId={p.id} shopId={p.shop.id} />
    </article>
  );
}

export function ProductGrid({ items, trust = {}, priorityCount = 0 }: { items: ProductCardData[]; trust?: Record<string, Trust>; priorityCount?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((p, i) => <li key={p.id}><ProductCard p={p} trust={trust[p.shop.id]} priority={i < priorityCount} /></li>)}
    </ul>
  );
}

export function ProductRail({ items, trust = {} }: { items: ProductCardData[]; trust?: Record<string, Trust> }) {
  return (
    <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 lg:grid-cols-5">
      {items.map((p) => <li key={p.id} className="w-[44vw] max-w-[220px] shrink-0 snap-start md:w-auto md:max-w-none"><ProductCard p={p} trust={trust[p.shop.id]} /></li>)}
    </ul>
  );
}
