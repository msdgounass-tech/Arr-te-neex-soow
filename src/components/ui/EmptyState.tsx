import Link from "next/link";
import { BrandLogo } from "@/components/brand/Logo";

export function EmptyState({ title, text, cta }: { title: string; text?: string; cta?: { href: string; label: string } }) {
  return (
    <div className="surface relative flex flex-col items-center overflow-hidden px-6 py-16 text-center">
      <div aria-hidden className="tech-grid absolute inset-0 opacity-50" />
      <BrandLogo size={56} decorative className="relative h-14 w-14 animate-float-slow" />
      <p className="display relative mt-6 text-2xl md:text-3xl">{title}</p>
      {text && <p className="relative mt-3 max-w-md text-sm leading-relaxed text-mist">{text}</p>}
      {cta && (
        <Link href={cta.href} className="btn btn-outline relative mt-8">
          {cta.label}
        </Link>
      )}
    </div>
  );
}
