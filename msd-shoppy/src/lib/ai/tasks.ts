import "server-only";
import { z } from "zod";

// Tâches de Shoppy AI : chaque tâche a sa fonction (quota), son format de sortie et ses consignes.
// Règle commune : ne jamais inventer de caractéristique, de chiffre ou de donnée de marché.

const COMMON = `Tu es Shoppy AI, le rédacteur et conseiller commercial de Shoppy by MSD, une marketplace multi-vendeurs au Sénégal (monnaie : FCFA).
Tu écris pour des commerçants sénégalais et leurs clients : un français vivant, chaleureux, direct, qui donne envie d'acheter — comme un bon vendeur au marché Sandaga ou sur WhatsApp, mais professionnel.
Ton travail : produire des textes PRÊTS À PUBLIER, qui valorisent le produit et rassurent l'acheteur.
Règles :
- Le texte publié s'adresse au CLIENT. Ne parle jamais de « la photo », de l'éclairage, de « la boutique indique que », ni de ce qui reste à vérifier : ces remarques vont uniquement dans la liste des points à vérifier.
- Mets en valeur ce qui est visible ou fourni : usage, style, bénéfices pour le client, confort, praticité, occasion d'achat, services de la boutique (livraison, garantie, essai) s'ils sont indiqués.
- N'invente aucun fait vérifiable (modèle exact, capacité, dimensions, matière, origine, garantie, prix). Si une information clé manque, écris un repère entre crochets que le vendeur complétera, par exemple [capacité : 64 Go / 128 Go] ou [taille], au lieu d'affirmer ou de t'excuser.
- Pas de superlatifs mensongers (« le meilleur », « n°1 ») ni de fausse urgence ; une vraie raison d'acheter vaut mieux.
- Ne promets jamais un résultat (ventes, rentabilité) dans un conseil : formule des recommandations.`;
export const productContentSchema = z.object({
  title: z.string().describe("Titre d'annonce vendeur, 35 à 70 caractères : type de produit + marque/modèle si connus (sinon repère entre crochets) + 1 atout clé. Ex. : « iPhone [modèle] reconditionné – garanti 3 mois, testé devant vous ». Jamais « vue arrière », « photo de »."),
  description: z.string().describe("Annonce prête à publier, adressée au client, 60 à 140 mots : une phrase d'accroche, les bénéfices, puis une courte liste à puces (•) des points clés et services (livraison, garantie, paiement) s'ils sont connus, et une invitation à commander. Aucun commentaire sur la photo ni sur ce qui manque."),
  category: z.string().nullable().describe("Slug exact d'une catégorie de la liste fournie, ou null si aucune ne convient"),
  keywords: z.array(z.string()).describe("5 à 10 mots-clés de recherche, en minuscules"),
  selling_points: z.array(z.string()).describe("3 à 5 arguments de vente courts"),
  to_verify: z.array(z.string()).describe("Remarques pour le vendeur uniquement (jamais publiées) : repères entre crochets à compléter, incohérences (ex. titre actuel sans rapport avec la photo), conseils photo. 2 à 5 points courts."),
  detected_product: z.string().nullable().describe("Type de produit identifié sur la photo, ou null"),
});

export const adCopySchema = z.object({
  whatsapp: z.string().describe("Message WhatsApp (statut ou diffusion) accrocheur, 3 à 6 lignes, emojis bien choisis, prix si connu, et appel à commander (« Écrivez-moi », « Commandez sur Shoppy »)"),
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
    system: `${COMMON}\nTâche : rédiger une fiche produit qui donne envie d'acheter (titre, description, catégorie, mots-clés, arguments) à partir des notes du vendeur et, si fournie, de la photo. Identifie le produit sur la photo pour choisir le bon vocabulaire et la bonne catégorie. Si le titre ou les notes actuels ne correspondent pas à la photo, base-toi sur la photo et signale l'écart dans to_verify.` },
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

const image = z.object({ mediaType: z.enum(["image/jpeg", "image/png", "image/webp"]), data: z.string().max(1_500_000) });
export const INPUTS = {
  product_content: z.object({ notes: z.string().max(2000).default(""), title: z.string().max(140).default(""), price: z.number().int().positive().optional(), images: z.array(image).max(4).default([]) })
    .refine((v) => v.notes.trim() || v.title.trim() || v.images.length, "Ajoutez une photo ou quelques mots sur le produit."),
  ad_copy: z.object({ productId: z.string().uuid().optional(), brief: z.string().max(1500).default("") }),
  translate: z.object({ text: z.string().min(2).max(4000), target: z.enum(["fr", "en", "wo"]) }),
  advisor: z.object({ question: z.string().min(3).max(600) }),
  customer_reply: z.object({ message: z.string().min(3).max(2000), context: z.string().max(600).default("") }),
} as const;
