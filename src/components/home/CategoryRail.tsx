import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/product/ProductCard";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

/** Section d'accueil par catégorie : titre + 4 produits (2 colonnes sur mobile). */
export function CategoryRail({ eyebrow, title, href, products, tone = "plain" }: { eyebrow: string; title: string; href: string; products: Product[]; tone?: "plain" | "soft" }) {
  if (!products.length) return null;
  return (
    <section className={tone === "soft" ? "border-y border-white/[0.05] bg-ink-2/50 py-16 md:py-24" : "py-16 md:py-24"}>
      <div className="container-luxe">
        <SectionHeading eyebrow={eyebrow} title={title} href={href} linkLabel="Voir tout" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {products.slice(0, 4).map((p, i) => (
            <Reveal key={p.id} delay={i * 0.06} className="h-full">
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
