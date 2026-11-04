import { useId } from "react";
import clsx from "clsx";

/** Emblème monogramme « GL » — double anneau, G et L entrelacés, filet doré. */
export function Emblem({ className, title = "GOUNASS LUXURY" }: { className?: string; title?: string }) {
  const gid = `gl-gold-${useId().replace(/:/g, "")}`;
  const fill = `url(#${gid})`;
  return (
    <svg viewBox="0 0 100 100" className={clsx("text-gold", className)} role="img" aria-label={title}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9C7C3F" />
          <stop offset=".45" stopColor="#E7CF9B" />
          <stop offset=".7" stopColor="#C6A15B" />
          <stop offset="1" stopColor="#8A6A32" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="none" stroke={fill} strokeWidth="1.2" />
      <circle cx="50" cy="50" r="43.5" fill="none" stroke={fill} strokeWidth=".5" />
      <path d="M50 2.5 L52 6.5 L50 10.5 L48 6.5 Z M50 89.5 L52 93.5 L50 97.5 L48 93.5 Z" fill={fill} />
      <text
        x="44"
        y="66"
        textAnchor="middle"
        fontFamily="var(--font-cormorant), 'Times New Roman', serif"
        fontSize="54"
        fontWeight="500"
        fill={fill}
      >
        G
      </text>
      <text
        x="60"
        y="72"
        textAnchor="middle"
        fontFamily="var(--font-cormorant), 'Times New Roman', serif"
        fontSize="40"
        fontStyle="italic"
        fontWeight="400"
        fill={fill}
      >
        L
      </text>
      <line x1="28" y1="78" x2="72" y2="78" stroke={fill} strokeWidth=".6" />
    </svg>
  );
}

export function Wordmark({ className, compact = false, logoUrl }: { className?: string; compact?: boolean; logoUrl?: string }) {
  return (
    <span className={clsx("flex items-center gap-3", className)}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="GOUNASS LUXURY" className={clsx("rounded-full object-cover", compact ? "h-9 w-9" : "h-11 w-11")} />
      ) : (
        <Emblem className={compact ? "h-9 w-9" : "h-11 w-11"} />
      )}
      <span className="flex flex-col leading-none">
        <span className={clsx("display tracking-[0.28em] text-ivory", compact ? "text-[1.05rem]" : "text-[1.3rem]")}>GOUNASS</span>
        <span className="mt-1 text-[0.68rem] tracking-[0.62em] text-gold">LUXURY</span>
      </span>
    </span>
  );
}
