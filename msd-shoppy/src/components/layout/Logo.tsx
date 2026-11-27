import Link from "next/link";

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--color-orange)" />
      <path d="M11 12.5V11a5 5 0 0 1 10 0v1.5" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M8.5 12.5h15l-1.2 11a2 2 0 0 1-2 1.8h-8.6a2 2 0 0 1-2-1.8z" fill="#fff" />
      <path d="M12.5 17.5l2 2.5 2-2.5 2 2.5 2-2.5" fill="none" stroke="var(--color-orange)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="press flex items-center gap-2" aria-label="Shoppy by MSD, accueil">
      <LogoMark />
      <span className="font-display text-[1.2rem] font-bold leading-none tracking-tight">
        Shoppy <span className="text-[0.8em] font-semibold text-orange-text">by MSD</span>
      </span>
    </Link>
  );
}
