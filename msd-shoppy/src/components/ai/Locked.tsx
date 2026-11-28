import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { minPlanFor, FEATURE_LABEL, type Level } from "@/lib/plans";

const NAME: Record<string, string> = { starter: "Starter", pro: "Pro", business: "Business" };

/** Suggestion de mise à niveau, discrète : jamais de fenêtre surgissante. */
export function Locked({ feature, matrix, atLeast = "basic", expired = false }:
  { feature: string; matrix: { plan_code: string; feature: string; level: Level }[]; atLeast?: Level; expired?: boolean }) {
  const plan = minPlanFor(matrix, feature, atLeast);
  return (
    <div className="card flex flex-col items-start gap-3 p-5">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-mist"><Icon name="lock" size={20} /></span>
      <div>
        <b className="block">{FEATURE_LABEL[feature] ?? "Cette fonction"} {expired ? "est en pause" : `est incluse dans la formule ${plan ? NAME[plan] : "supérieure"}`}</b>
        <p className="mt-1 text-sm text-slate">{expired
          ? "Votre abonnement n'est pas actif. Réactivez-le pour retrouver Shoppy AI : vos données sont conservées."
          : "Passez à cette formule pour l'utiliser. Vos analyses actuelles restent disponibles."}</p>
      </div>
      <Link href="/vendeur/abonnement" className="btn btn-secondary press">Voir les formules</Link>
    </div>
  );
}

export function DataNote({ children }: { children: React.ReactNode }) {
  return <p className="flex gap-2 rounded-xl bg-mist p-3 text-xs text-slate"><Icon name="info" size={16} className="mt-px shrink-0" /><span>{children}</span></p>;
}

export function ConfidenceTag({ value }: { value: "faible" | "moyenne" | "bonne" }) {
  const tone = value === "bonne" ? "bg-success-soft text-success" : value === "moyenne" ? "bg-warning-soft text-warning" : "bg-mist text-slate";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>Confiance {value}</span>;
}
