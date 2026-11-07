import Link from "next/link";
import { Reveal } from "./Reveal";
import { ArrowRight } from "./Icons";

export function SectionHeading({
  eyebrow,
  title,
  href,
  linkLabel = "Tout voir",
  align = "between",
  id,
  text,
}: {
  eyebrow: string;
  title: string;
  href?: string;
  linkLabel?: string;
  align?: "between" | "center";
  id?: string;
  text?: string;
}) {
  return (
    <Reveal className={align === "center" ? "mx-auto mb-12 max-w-3xl text-center md:mb-16" : "mb-10 flex flex-col gap-5 md:mb-14 md:flex-row md:items-end md:justify-between"}>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={id} className="display mt-4 text-[2.1rem] sm:text-5xl md:text-6xl">{title}</h2>
        {text && <p className="mt-4 max-w-xl leading-relaxed text-mist">{text}</p>}
      </div>
      {href && (
        <Link href={href} className={`group inline-flex shrink-0 items-center gap-2.5 text-sm font-semibold text-ivory/90 hover:text-white ${align === "center" ? "mt-6 justify-center" : ""}`}>
          {linkLabel}
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 transition-all duration-500 group-hover:border-ivory group-hover:bg-ivory group-hover:text-ink">
            <ArrowRight width={16} height={16} className="transition-transform duration-500 group-hover:translate-x-0.5" />
          </span>
        </Link>
      )}
    </Reveal>
  );
}
