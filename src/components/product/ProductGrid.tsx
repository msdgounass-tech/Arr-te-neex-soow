import type { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { Reveal } from "@/components/ui/Reveal";

export function ProductGrid({ products, columns = 4 }: { products: Product[]; columns?: 3 | 4 }) {
  return (
    <div className={columns === 4 ? "grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 xl:grid-cols-4" : "grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5"}>
      {products.map((p, i) =>
        // Les premières cartes apparaissent en CSS (sans attendre JavaScript), les suivantes au défilement.
        i < 4 ? (
          <div key={p.id} className="anim-rise h-full" style={{ animationDelay: `${0.05 + i * 0.06}s` }}>
            <ProductCard product={p} priority={i < 2} />
          </div>
        ) : (
          <Reveal key={p.id} delay={(i % 4) * 0.07} className="h-full">
            <ProductCard product={p} />
          </Reveal>
        ),
      )}
    </div>
  );
}
