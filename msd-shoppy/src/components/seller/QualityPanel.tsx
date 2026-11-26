import { productQuality, qualityLabel, type QualityInput } from "@/lib/quality";
import { Icon } from "@/components/ui/Icon";

export function QualityPanel({ input }: { input: QualityInput }) {
  const { score, tips } = productQuality(input);
  const { label, tone } = qualityLabel(score);
  const color = tone === "success" ? "var(--color-success)" : tone === "warning" ? "var(--color-warning)" : "var(--color-danger)";
  return (
    <section className="card p-5" aria-labelledby="quality-title">
      <h2 id="quality-title" className="font-semibold">Qualité de présentation</h2>
      <div className="mt-3 flex items-center gap-4">
        <svg width="64" height="64" viewBox="0 0 36 36" aria-hidden="true" className="-rotate-90">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-mist)" strokeWidth="4" />
          <circle cx="18" cy="18" r="15.5" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(score / 100) * 97.4} 97.4`}
            style={{ transition: "stroke-dasharray var(--dur-reveal) var(--ease-out)" }} />
        </svg>
        <div><p className="font-display text-2xl font-bold">{score}<span className="text-sm text-slate"> / 100</span></p><p className="text-sm" style={{ color }}>{label}</p></div>
      </div>
      {tips.length > 0 ? (
        <ul className="mt-4 space-y-3">{tips.map((t) => (
          <li key={t.key} className="flex gap-2 text-sm"><Icon name="bulb" size={18} className="mt-0.5 shrink-0 text-orange-text" />
            <span><b>{t.message}</b> <span className="text-xs text-orange-text">+{t.points} pts</span><br /><span className="text-slate">{t.how}</span></span></li>))}</ul>
      ) : <p className="mt-3 text-sm text-success">Fiche complète : rien à améliorer.</p>}
      <p className="mt-4 text-xs text-slate">Obligatoire pour publier : une catégorie et au moins une photo. Le score ne bloque jamais la publication.</p>
    </section>
  );
}
