import Link from "next/link";
import clsx from "clsx";
import type { CategoryNode } from "@/lib/types";
import { CategoryIcon } from "@/components/layout/CategoryIcon";
import { ArrowRight } from "@/components/ui/Icons";
import { Reveal } from "@/components/ui/Reveal";
import { Spotlight } from "@/components/ui/Spotlight";
import { SectionHeading } from "@/components/ui/SectionHeading";

/** Grille « bento » des univers du catalogue (catégories de la base). */
export function UniverseGrid({ tree, counts }: { tree: CategoryNode[]; counts: Record<string, number> }) {
  if (!tree.length) return null;
  return (
    <section className="container-luxe py-20 md:py-28" aria-labelledby="univers">
      <SectionHeading eyebrow="Le catalogue" title="Explorer par univers" href="/shop" linkLabel="Tout le catalogue" id="univers" />
      <div className="grid grid-cols-2 gap-3 md:grid-flow-row-dense md:grid-cols-4 md:gap-4">
        {tree.map((c, i) => {
          const big = i === 0 || i === 3;
          const n = counts[c.slug] ?? 0;
          return (
            <Reveal key={c.slug} delay={(i % 4) * 0.06} className={clsx(big && "col-span-2 md:row-span-2")}>
              <Spotlight className="surface group h-full overflow-hidden transition-colors duration-500 hover:border-white/20">
                <Link href={`/categorie/${c.slug}`} className={clsx("relative z-[2] flex h-full flex-col justify-between p-5 md:p-7", big ? "min-h-[15rem] md:min-h-[26rem]" : "min-h-[11rem] md:min-h-[12.5rem]")}>
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-accent-light transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:-translate-y-1 group-hover:scale-110">
                      <CategoryIcon slug={c.slug} width={24} height={24} />
                    </span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-mist transition-all duration-500 group-hover:border-accent group-hover:bg-accent group-hover:text-ink">
                      <ArrowRight width={16} height={16} className="-rotate-45 transition-transform duration-500 group-hover:rotate-0" />
                    </span>
                  </div>
                  {big && (
                    <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-20 opacity-[0.07] transition-all duration-1000 group-hover:-translate-y-3 group-hover:opacity-[0.12]">
                      <CategoryIcon slug={c.slug} width={320} height={320} strokeWidth={0.6} />
                    </div>
                  )}
                  <div className="relative">
                    <h3 className={clsx("display", big ? "text-3xl md:text-5xl" : "text-xl md:text-2xl")}>{c.name}</h3>
                    {big && c.description && <p className="mt-3 max-w-sm text-sm leading-relaxed text-mist">{c.description}</p>}
                    <p className="mt-2 text-[0.8rem] text-mist">
                      {n > 0 ? `${n} produit${n > 1 ? "s" : ""}` : c.children.map((s) => s.name).slice(0, 3).join(" · ")}
                    </p>
                  </div>
                </Link>
              </Spotlight>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
