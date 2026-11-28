// Formules Shoppy by MSD : présentation des avantages. Les prix et les droits réels vivent en base
// (tables subscription_plans et plan_features) ; ce fichier ne décide de rien côté sécurité.
// « soon » = fonctionnalité annoncée mais pas encore disponible : elle est affichée comme telle, jamais comme acquise.

export type PlanCode = "starter" | "pro" | "business";
export interface PlanFeature { label: string; soon?: boolean }
export interface PlanInfo { code: PlanCode; tagline: string; highlight?: boolean; includesPrevious?: PlanCode; features: PlanFeature[] }

export const PLAN_ORDER: PlanCode[] = ["starter", "pro", "business"];

export const PLANS: Record<PlanCode, PlanInfo> = {
  starter: {
    code: "starter", tagline: "Pour les vendeurs qui commencent leur activité",
    features: [
      { label: "Boutique professionnelle : nom, logo, description, secteur et catégories" },
      { label: "Produits, commandes et stock de base" },
      { label: "Contact par WhatsApp et téléphone" },
      { label: "Statistiques essentielles et visites de la boutique" },
      { label: "Favoris, avis clients vérifiés, partage" },
      { label: "Assistant de prise en main et conseils pour vos fiches" },
      { label: "Shoppy AI : titres, descriptions et textes publicitaires (quota mensuel limité)" },
    ],
  },
  pro: {
    code: "pro", tagline: "Pour développer vos ventes", highlight: true, includesPrevious: "starter",
    features: [
      { label: "Statistiques avancées : clics, conversions, comparaison de périodes" },
      { label: "Shoppy AI : analyse des ventes, des prix et de la concurrence" },
      { label: "Recherche de produits à potentiel et tendances du marché" },
      { label: "Contenus publicitaires avancés, traduction français · anglais · wolof" },
      { label: "Plan d'action commercial chaque semaine" },
      { label: "Gestion intelligente du stock (alertes de rupture)" },
      { label: "Coupons de réduction et promotions", soon: true },
      { label: "Mise en avant ponctuelle de produits", soon: true },
      { label: "Relance des clients intéressés, avec leur accord", soon: true },
    ],
  },
  business: {
    code: "business", tagline: "Pour les commerces en croissance", includesPrevious: "pro",
    features: [
      { label: "Quotas Shoppy AI étendus et conseiller commercial personnalisé" },
      { label: "Analyses complètes : prévisions, stock avancé, concurrence approfondie" },
      { label: "Exportation des statistiques et rapports (CSV)" },
      { label: "Assistance prioritaire" },
      { label: "Gestion de plusieurs employés, rôles et permissions", soon: true },
      { label: "Campagnes sponsorisées et outils publicitaires avancés", soon: true },
    ],
  },
};

/** Économie réalisée avec le paiement annuel par rapport à 12 mois payés au mois. */
export function yearlySaving(monthly: number, yearly: number) {
  return Math.max(0, monthly * 12 - yearly);
}

export const FEATURE_LABEL: Record<string, string> = {
  ai_content: "Titres, descriptions, catégories et mots-clés",
  ai_ads: "Textes publicitaires",
  ai_translate: "Traduction",
  ai_chat: "Conversation avec Shoppy AI",
  sales: "Analyse des ventes",
  market: "Recherche de produits",
  competitors: "Analyse concurrentielle",
  pricing: "Prix et rentabilité",
  stock: "Gestion intelligente du stock",
  action_plan: "Plan d'action",
  export: "Rapports exportables",
};

export type Level = "none" | "basic" | "full" | "advanced";
export const LEVEL_LABEL: Record<Level, string> = { none: "Non inclus", basic: "Essentiel", full: "Inclus", advanced: "Avancé" };

/** Formule minimale qui débloque un niveau donné (pour les suggestions de mise à niveau). */
export function minPlanFor(matrix: { plan_code: string; feature: string; level: Level }[], feature: string, atLeast: Level = "basic"): PlanCode | null {
  const rank: Record<Level, number> = { none: 0, basic: 1, full: 2, advanced: 3 };
  for (const code of PLAN_ORDER) {
    const row = matrix.find((m) => m.plan_code === code && m.feature === feature);
    if (row && rank[row.level] >= rank[atLeast]) return code;
  }
  return null;
}
