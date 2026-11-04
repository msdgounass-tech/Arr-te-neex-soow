import Link from "next/link";
import { Reveal } from "./Reveal";
import { ArrowRight } from "./Icons";

export function SectionHeading({ eyebrow, title, href, linkLabel = "Tout voir", align = "between" }: { eyebrow: string; title: string; href?: string; linkLabel?: string; align?: "between" | "center" }) {
  return (
    <Reveal className={align === "center" ? "mb-12 text-center md:mb-16" : "mb-10 flex flex-col gap-6 md:mb-14 md:flex-row md:items-end md:justify-between"}>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="display mt-4 text-[2.4rem] md:text-6xl">{title}</h2>
      </div>
      {href && (
        <Link href={href} className={`group inline-flex items-center gap-3 text-[0.74rem] uppercase tracking-[0.3em] text-ivory/90 hover:text-gold ${align === "center" ? "mt-6 justify-center" : ""}`}>
          {linkLabel}
          <ArrowRight className="transition-transform duration-500 group-hover:translate-x-1.5" />
        </Link>
      )}
    </Reveal>
  );
}
