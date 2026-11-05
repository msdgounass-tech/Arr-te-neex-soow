import Link from "next/link";
import { BrandLogo } from "@/components/brand/Logo";

export function EmptyState({ title, text, cta }: { title: string; text?: string; cta?: { href: string; label: string } }) {
  return (
    <div className="flex flex-col items-center border border-white/[0.1] bg-ink-2/60 px-6 py-16 text-center">
      <BrandLogo size={64} className="h-16 w-16 opacity-90" />
      <p className="display mt-6 text-3xl">{title}</p>
      {text && <p className="mt-3 max-w-md text-sm leading-relaxed text-mist">{text}</p>}
      {cta && (
        <Link href={cta.href} className="btn btn-ghost-gold mt-8">
          {cta.label}
        </Link>
      )}
    </div>
  );
}
