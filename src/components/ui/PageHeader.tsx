/** En-tête commun des pages de contenu (aide, livraison, contact…). */
export function PageHeader({ eyebrow, title, intro, center = false }: { eyebrow: string; title: string; intro?: React.ReactNode; center?: boolean }) {
  return (
    <header className={`relative pb-10 pt-10 md:pb-14 md:pt-16 ${center ? "text-center" : ""}`}>
      <div aria-hidden className={`pointer-events-none absolute -top-16 h-64 w-[36rem] max-w-full bg-[radial-gradient(closest-side,rgba(126,164,255,.14),transparent)] ${center ? "left-1/2 -translate-x-1/2" : "left-0"}`} />
      <div className="anim-rise relative">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="display mt-4 text-[2.6rem] sm:text-6xl md:text-7xl">{title}</h1>
        {intro && <p className={`mt-5 max-w-2xl leading-relaxed text-ivory/80 ${center ? "mx-auto" : ""}`}>{intro}</p>}
      </div>
    </header>
  );
}
