/** Coche de réussite : réservée aux moments rares (boutique créée, commande envoyée, premier produit publié). */
export function SuccessMark({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" aria-hidden="true">
      <circle className="success-ring" cx="36" cy="36" r="34" fill="var(--color-success-soft)" stroke="var(--color-success)" strokeWidth="2" />
      <path className="success-check" pathLength={1} d="M22 37l9 9 19-20" fill="none" stroke="var(--color-success)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
