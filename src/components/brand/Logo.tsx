import { useId } from "react";
import Image from "next/image";
import clsx from "clsx";
import { BRAND, DEFAULT_LOGO } from "@/lib/site";

/** Monogramme vectoriel : un « G » géométrique gravé dans une puce arrondie, avec un reflet ionique. */
export function Emblem({ className, title = BRAND.name, decorative = false }: { className?: string; title?: string; decorative?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 48 48" className={className} {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": title })}>
      <defs>
        <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1d2230" />
          <stop offset="1" stopColor="#0a0c11" />
        </linearGradient>
        <linearGradient id={`st-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".55" stopColor="#b4caff" />
          <stop offset="1" stopColor="#7ea4ff" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="46" height="46" rx="14" fill={`url(#bg-${id})`} stroke="rgba(255,255,255,.14)" />
      <path
        d="M33 17.5A11 11 0 1 0 35 26h-10"
        fill="none"
        stroke={`url(#st-${id})`}
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="35" cy="13" r="2" fill="#63e6d2" />
    </svg>
  );
}

/** Logo : image téléversée dans l'admin si elle existe, sinon le monogramme vectoriel. */
export function BrandLogo({ size, src, className, priority = false, decorative = false }: { size: number; src?: string; className?: string; priority?: boolean; decorative?: boolean }) {
  const url = src || DEFAULT_LOGO;
  if (!url) return <Emblem decorative={decorative} className={clsx("shrink-0", className)} />;
  return (
    <Image
      src={url}
      alt={decorative ? "" : BRAND.name}
      width={size}
      height={size}
      priority={priority}
      sizes={`${size}px`}
      className={clsx("shrink-0 rounded-2xl object-cover", className)}
    />
  );
}

export function Wordmark({ className, compact = false, logoUrl }: { className?: string; compact?: boolean; logoUrl?: string }) {
  return (
    <span className={clsx("flex items-center gap-2.5", className)}>
      <BrandLogo size={compact ? 36 : 44} src={logoUrl} priority decorative className={compact ? "h-9 w-9" : "h-11 w-11"} />
      <span className="flex flex-col leading-none">
        <span className={clsx("display tracking-[0.02em] text-ivory", compact ? "text-[1.12rem]" : "text-[1.35rem]")}>{BRAND.name}</span>{" "}
        <span className="mt-1 text-[0.6rem] font-bold uppercase tracking-[0.34em] text-accent-light">{BRAND.tagline}</span>
      </span>
    </span>
  );
}
