const MESSAGES: Record<string, string> = {
  NON_CONNECTE: "Connectez-vous pour continuer.",
  INTERDIT: "Vous n'avez pas accès à cette action.",
  BOUTIQUE_EXISTANTE: "Vous avez déjà une boutique.",
  NOM_INVALIDE: "Le nom de la boutique doit contenir au moins 2 caractères.",
  DOMAINE_INVALIDE: "Choisissez un domaine d'activité.",
  CONTACT_REQUIS: "Indiquez au moins un numéro public : téléphone ou WhatsApp.",
  CATEGORIE_REQUISE: "Choisissez une catégorie avant de publier.",
  PHOTO_REQUISE: "Ajoutez au moins une photo avant de publier.",
  ABONNEMENT_INACTIF: "Votre abonnement n'est pas actif. Réactivez-le pour gérer votre boutique.",
  PANIER_VIDE: "Votre panier est vide.",
  PANIER_TROP_GRAND: "Votre panier contient trop d'articles.",
  NOM_REQUIS: "Indiquez le nom de la personne qui reçoit la commande.",
  TELEPHONE_INVALIDE: "Indiquez un numéro de téléphone valide.",
  ADRESSE_REQUISE: "Indiquez la région et la ville de livraison.",
  PRODUIT_INTROUVABLE: "Un produit de votre panier n'existe plus.",
  ACHAT_PROPRE_BOUTIQUE: "Vous ne pouvez pas commander dans votre propre boutique.",
  BOUTIQUE_INDISPONIBLE: "Une boutique de votre panier n'accepte pas de commandes pour le moment.",
  PRODUIT_INDISPONIBLE: "Ce produit n'est plus disponible",
  RUPTURE: "Ce produit est en rupture de stock",
  VARIANTE_INDISPONIBLE: "Cette variante n'est plus disponible",
  VARIANTE_REQUISE: "Choisissez une taille, une couleur ou un modèle pour",
  STOCK_INSUFFISANT: "Stock insuffisant pour",
  COMMANDE_INTROUVABLE: "Commande introuvable.",
  TRANSITION_INTERDITE: "Ce changement de statut n'est pas possible à cette étape.",
  MOTIF_REQUIS: "Indiquez un motif pour le client.",
  COMMANDE_NON_TERMINEE: "Vous pourrez laisser un avis une fois la commande terminée.",
  NOTE_INVALIDE: "Choisissez une note de 1 à 5 étoiles.",
  AUCUNE_BOUTIQUE: "Créez d'abord votre boutique.",
  PAIEMENT_DEJA_EN_ATTENTE: "Un paiement est déjà en cours de vérification.",
  BOUTIQUE_ACTIVE: "Fermez d'abord votre boutique avant de supprimer votre compte. Contactez l'assistance.",
  COMMANDES_EN_COURS: "Vous avez des commandes en cours. Attendez qu'elles soient terminées ou annulées.",
  DONNEES_PERSONNELLES_RESTANTES: "La suppression n'a pas pu effacer toutes vos données. Réessayez.",
  COMPTE_REQUIS: "Créez un compte (e-mail et mot de passe) pour effectuer cette action.",
  ACTION_INVALIDE: "Action non reconnue.",
  BOUTIQUE_INTROUVABLE: "Boutique introuvable.",
  PAIEMENT_INTROUVABLE: "Ce paiement a déjà été traité.",
  SLUG_INDISPONIBLE: "Ce nom est déjà très utilisé. Essayez une variante.",
  FORMULE_INVALIDE: "Choisissez une formule disponible.",
  PERIODE_INVALIDE: "Choisissez un paiement mensuel ou annuel.",
  BOUTIQUE_SUSPENDUE: "Votre boutique est suspendue. Contactez l'assistance.",
  MODULE_DESACTIVE: "Ce module de Shoppy AI est momentanément désactivé.",
  FONCTION_NON_INCLUSE: "Cette fonction n'est pas incluse dans votre formule.",
  QUOTA_EPUISE: "Vous avez utilisé tout votre quota Shoppy AI de ce mois pour cette fonction.",
  TROP_DE_REQUETES: "Trop de demandes en peu de temps. Patientez une minute.",
  STATUT_INVALIDE: "Statut non reconnu.",
  ACTION_INTROUVABLE: "Recommandation introuvable.",
  NIVEAU_INVALIDE: "Niveau non reconnu.",
  QUOTA_INVALIDE: "Quota invalide.",
  MODULE_INTROUVABLE: "Module introuvable.",
  PRODUIT_INACCESSIBLE: "Ce produit n'appartient pas à votre boutique.",
};

/** Traduit une erreur Supabase / PostgreSQL en message clair pour l'utilisateur. */
export function friendlyError(error: unknown): string {
  const raw = typeof error === "string" ? error : (error as { message?: string })?.message ?? "";
  const [code, detail] = raw.split(":");
  const msg = MESSAGES[code?.trim()];
  if (msg) return detail ? `${msg} : ${detail.trim()}.` : msg;
  if (/duplicate key/.test(raw)) return "Cet élément existe déjà.";
  if (/violates check constraint/.test(raw)) return "Une information saisie n'est pas valide.";
  if (/row-level security|permission denied/.test(raw)) return "Vous n'avez pas accès à cette action.";
  if (/Invalid login credentials/.test(raw)) return "E-mail ou mot de passe incorrect.";
  if (/User already registered/.test(raw)) return "Un compte existe déjà avec cet e-mail. Connectez-vous.";
  if (/Password should be/.test(raw)) return "Le mot de passe doit contenir au moins 8 caractères.";
  if (/Email not confirmed/.test(raw)) return "Confirmez votre e-mail avec le lien reçu avant de vous connecter.";
  if (/fetch failed|Failed to fetch|NetworkError/.test(raw)) return "Connexion impossible. Vérifiez votre réseau et réessayez.";
  return "Une erreur est survenue. Réessayez dans un instant.";
}

export type ActionResult<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; error: string; fields?: Record<string, string>; data?: T };
