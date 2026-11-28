import "server-only";
import { z } from "zod";

// Tâches de Shoppy AI : chaque tâche a sa fonction (quota), son format de sortie et ses consignes.
// Règle commune : ne jamais inventer de caractéristique, de chiffre ou de donnée de marché.

const COMMON = `Tu es Shoppy AI, l'assistant commercial de Shoppy by MSD, une marketplace multi-vendeurs au Sénégal (monnaie : franc CFA, FCFA).
Tu aides des commerçants, souvent sur téléphone, à mieux vendre. Écris en français simple, concret et professionnel, sans jargon.
Règles impératives :
- N'invente jamais de caractéristique produit, de matière, de dimension, d'origine, de certification, de chiffre de vente ou de donnée de marché.
- Si une information n'est pas fournie ou visible, ne l'affirme pas : signale-la dans la liste des points à vérifier.
- Distingue toujours ce qui est observé (données fournies) de ce qui est estimé.
- Ne promets jamais un résultat (ventes, rentabilité) : formule des recommandations.
- Pas de superlatifs trompeurs (« le meilleur », « n°1 ») ni de fausse urgence.`;

export const productContentSchema = z.object({
  title: z.string().describe("Titre clair, 40 à 80 caractères, sans majuscules abusives"),
  description: z.string().describe("Description commerciale de 3 à 6 phrases, basée uniquement sur les informations fournies ou visibles"),
  category: z.string().nullable().describe("Slug exact d'une catégorie de la liste fournie, ou null si aucune ne convient"),
  keywords: z.array(z.string()).describe("5 à 10 mots-clés de recherche, en minuscules"),
  selling_points: z.array(z.string()).describe("3 à 5 arguments de vente courts"),
  to_verify: z.array(z.string()).describe("Informations à vérifier ou compléter par le vendeur avant publication"),
  detected_product: z.string().nullable().describe("Type de produit identifié sur la photo, ou null"),
});

export const adCopySchema = z.object({
  whatsapp: z.string().describe("Message WhatsApp (statut ou diffusion), 3 à 6 lignes, avec emojis sobres"),
  facebook: z.string().describe("Publication Facebook, 4 à 8 lignes, avec appel à l'action"),
  instagram: z.string().describe("Légende Instagram avec 5 à 10 hashtags pertinents"),
  variants: z.array(z.string()).describe("3 accroches courtes alternatives"),
  video: z.object({
    hook: z.string().describe("Accroche des 3 premières secondes"),
    scenes: z.array(z.string()).describe("4 à 6 plans décrits simplement, filmables au téléphone"),
    voiceover: z.string().describe("Texte de voix off, 20 à 40 secondes"),
  }),
  audience: z.array(z.string()).describe("Publics potentiels à cibler (centres d'intérêt, situations), sans données personnelles"),
  visual_tips: z.array(z.string()).describe("Conseils pour les visuels"),
});

export const translateSchema = z.object({
  text: z.string(),
  note: z.string().nullable().describe("Remarque sur la traduction (termes sans équivalent, relecture conseillée), ou null"),
});

export const chatSchema = z.object({
  answer: z.string().describe("Réponse structurée, 80 à 250 mots, avec des actions concrètes"),
  based_on: z.array(z.string()).describe("Données de la boutique réellement utilisées pour répondre"),
  limits: z.string().describe("Limites de l'analyse (données manquantes, faible volume, estimation)"),
  next_steps: z.array(z.string()).describe("2 à 4 actions concrètes et vérifiables"),
});

export const replySchema = z.object({
  reply: z.string().describe("Réponse au client, polie et professionnelle, 2 à 6 phrases"),
  tips: z.array(z.string()).describe("Conseils au vendeur pour traiter ce cas"),
});

export const TASKS = {
  product_content: { feature: "ai_content", effort: "low", maxTokens: 3000, schema: productContentSchema,
    system: `${COMMON}\nTâche : rédiger une fiche produit (titre, description, catégorie, mots-clés, arguments) à partir des notes du vendeur et, si fournie, de la photo. Si la photo ne permet pas d'identifier le produit, dis-le dans to_verify.` },
  ad_copy: { feature: "ai_ads", effort: "low", maxTokens: 3500, schema: adCopySchema,
    system: `${COMMON}\nTâche : préparer des textes publicitaires pour WhatsApp, Facebook et Instagram et un script vidéo court. Les publications sont publiées par le vendeur lui-même : tu ne crées ni ne gères aucune campagne.` },
  translate: { feature: "ai_translate", effort: "low", maxTokens: 3000, schema: translateSchema,
    system: `${COMMON}\nTâche : traduire fidèlement un texte commercial, sans rien ajouter. Pour le wolof, utilise l'orthographe officielle (CLAD) et signale dans note qu'une relecture par un locuteur est conseillée.` },
  advisor: { feature: "ai_chat", effort: "medium", maxTokens: 4000, schema: chatSchema,
    system: `${COMMON}\nTâche : répondre à la question du vendeur en t'appuyant uniquement sur les données de sa boutique fournies en JSON (période, produits, consultations, commandes, prix du marché sur Shoppy). Si les données sont insuffisantes, dis-le et propose comment les obtenir. Les prix ou actions suggérés ne sont jamais appliqués automatiquement : le vendeur décide.` },
  customer_reply: { feature: "ai_chat", effort: "low", maxTokens: 1500, schema: replySchema,
    system: `${COMMON}\nTâche : rédiger une réponse à un message de client (question, réclamation, avis). Reste factuel, ne promets ni remboursement ni délai que le vendeur n'a pas indiqué.` },
} as const;

export type TaskName = keyof typeof TASKS;

const image = z.object({ mediaType: z.enum(["image/jpeg", "image/png", "image/webp"]), data: z.string().max(2_000_000) });
export const INPUTS = {
  product_content: z.object({ notes: z.string().max(2000).default(""), title: z.string().max(140).default(""), price: z.number().int().positive().optional(), image: image.optional() })
    .refine((v) => v.notes.trim() || v.title.trim() || v.image, "Ajoutez une photo ou quelques mots sur le produit."),
  ad_copy: z.object({ productId: z.string().uuid().optional(), brief: z.string().max(1500).default("") }),
  translate: z.object({ text: z.string().min(2).max(4000), target: z.enum(["fr", "en", "wo"]) }),
  advisor: z.object({ question: z.string().min(3).max(600) }),
  customer_reply: z.object({ message: z.string().min(3).max(2000), context: z.string().max(600).default("") }),
} as const;
