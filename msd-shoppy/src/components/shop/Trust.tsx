import Link from "next/link";
import type { Trust } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { Stars } from "@/components/ui/bits";
import { formatDate, plural } from "@/lib/format";

export const BADGES: Record<string, { label: string; icon: string; rule: string }> = {
  verified: { label: "Boutique vérifiée", icon: "badge", rule: "Identité et coordonnées contrôlées par l'équipe MSD Shoppy." },
  email_verified: { label: "E-mail confirmé", icon: "mail", rule: "Le vendeur a confirmé son adresse e-mail." },
  trusted_seller: { label: "Vendeur confirmé", icon: "shield", rule: "Au moins 5 commandes terminées et une note moyenne de 4/5 ou plus sur 3 avis minimum." },
  responsive: { label: "Très réactif", icon: "clock", rule: "Répond à 90 % des commandes en moins de 24 h (sur 5 commandes minimum)." },
  established: { label: "Boutique établie", icon: "store", rule: "Active sur MSD Shoppy depuis plus de 6 mois." },
};

/** Indicateur simplifié pour les fiches produits. */
export function TrustMini({ trust, shopSlug }: { trust: Trust | null; shopSlug: string }) {
  if (!trust) return null;
  return (
    <Link href={`/b/${shopSlug}#confiance`} className="press flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      {trust.reviews_count > 0 && trust.average_rating != null
        ? <span className="inline-flex items-center gap-1"><Stars value={trust.average_rating} /> <b>{trust.average_rating}</b> <span className="text-slate">({plural(trust.reviews_count, "avis", "avis")})</span></span>
        : <span className="text-slate">Pas encore d'avis</span>}
      <span className="text-slate">{plural(trust.completed_orders, "commande terminée", "commandes terminées")}</span>
      {trust.verified && <span className="inline-flex items-center gap-1 font-medium text-success"><Icon name="badge" size={15} /> Vérifiée</span>}
    </Link>
  );
}

/** Profil de confiance complet (page boutique). */
export function TrustPanel({ trust }: { trust: Trust | null }) {
  if (!trust) return null;
  const rows: [string, string, string][] = [
    ["package", "Commandes terminées", String(trust.completed_orders)],
    ["star", "Note moyenne", trust.reviews_count > 0 && trust.average_rating != null ? `${trust.average_rating} / 5 (${plural(trust.reviews_count, "avis", "avis")})` : "Pas encore d'avis"],
    ["clock", "Sur MSD Shoppy depuis", formatDate(trust.member_since)],
    ["phone", "Taux de réponse", trust.response_rate != null ? `${Math.round(trust.response_rate * 100)} % en moins de 24 h` : "Pas encore mesurable"],
  ];
  return (
    <section id="confiance" aria-labelledby="trust-title" className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="trust-title" className="text-lg font-semibold">Profil de confiance</h2>
        <Link href="/aide/confiance" className="link text-sm">Comment c'est calculé</Link>
      </div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {rows.map(([icon, label, value]) => (
          <div key={label} className="flex items-start gap-3 rounded-xl bg-mist p-3">
            <Icon name={icon} size={18} className="mt-0.5 text-orange-text" />
            <div><dt className="text-xs text-slate">{label}</dt><dd className="text-sm font-semibold">{value}</dd></div>
          </div>
        ))}
      </dl>
      {trust.badges.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {trust.badges.map((b) => BADGES[b] && (
            <li key={b} className="flex items-start gap-2 text-sm">
              <Icon name={BADGES[b].icon} size={18} className="mt-0.5 text-success" />
              <span><b>{BADGES[b].label}.</b> <span className="text-slate">{BADGES[b].rule}</span></span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-slate">Aucun badge pour le moment. Les badges sont attribués automatiquement selon l'activité réelle de la boutique.</p>
      )}
      <p className="mt-4 text-xs text-slate">Seules les commandes passées et terminées sur MSD Shoppy comptent. Les avis proviennent uniquement de clients dont la commande est terminée.</p>
    </section>
  );
}
