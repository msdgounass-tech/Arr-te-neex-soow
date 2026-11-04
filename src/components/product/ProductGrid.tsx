import type { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { Reveal } from "@/components/ui/Reveal";

export function ProductGrid({ products, columns = 4 }: { products: Product[]; columns?: 3 | 4 }) {
  return (
    <div className={columns === 4 ? "grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 xl:grid-cols-4 md:gap-x-6" : "grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6"}>
      {products.map((p, i) => (
        <Reveal key={p.id} delay={(i % 4) * 0.08}>
          <ProductCard product={p} priority={i < 4} />
        </Reveal>
      ))}
    </div>
  );
}
