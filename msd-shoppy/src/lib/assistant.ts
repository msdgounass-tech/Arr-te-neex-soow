// Assistant vendeur : contenus pédagogiques intégrés et règles de progression (aucune IA externe requise).

export interface GuideStep { title: string; text: string; demo: { screen: string; highlight: string; caption: string } }
export interface Guide { key: string; title: string; summary: string; minutes: number; steps: GuideStep[]; tips: string[]; action?: { href: string; label: string } }

export const GUIDES: Guide[] = [
  {
    key: "create_shop", title: "Créer sa boutique", summary: "Les informations qui rassurent dès la première visite.", minutes: 3,
    steps: [
      { title: "Choisissez un nom clair", text: "Utilisez le nom sous lequel vos clients vous connaissent déjà. Évitez les abréviations difficiles à retenir.", demo: { screen: "Nom de la boutique", highlight: "Awa Couture", caption: "Un nom court, facile à dire au téléphone." } },
      { title: "Indiquez votre domaine", text: "Le domaine principal place votre boutique dans la bonne catégorie d'Explorer.", demo: { screen: "Domaine principal", highlight: "Mode et habillement", caption: "Un seul domaine principal, plusieurs spécialités." } },
      { title: "Choisissez vos numéros publics", text: "Seuls les numéros que vous saisissez ici sont affichés. Utilisez un numéro professionnel si possible.", demo: { screen: "WhatsApp public", highlight: "77 123 45 67", caption: "Votre numéro personnel n'est jamais affiché automatiquement." } },
    ],
    tips: ["Un logo carré, lisible en petit, sur fond uni.", "Une description qui dit ce que vous vendez, où et comment vous livrez."],
    action: { href: "/vendeur/boutique", label: "Ouvrir ma boutique" },
  },
  {
    key: "complete_profile", title: "Compléter son profil", summary: "Logo, description et coordonnées : les premiers signaux de confiance.", minutes: 4,
    steps: [
      { title: "Ajoutez votre logo", text: "Un logo carré d'au moins 400 × 400 pixels. À défaut, une photo nette de votre devanture.", demo: { screen: "Logo", highlight: "Logo carré", caption: "Le logo apparaît sur chaque produit." } },
      { title: "Rédigez une description utile", text: "Trois phrases suffisent : ce que vous vendez, depuis quand, comment vous livrez.", demo: { screen: "Description", highlight: "Tenues sur mesure depuis 2015, livraison à Dakar en 48 h.", caption: "Précis et concret, sans formule toute faite." } },
      { title: "Précisez votre localisation", text: "La région et la ville permettent aux acheteurs proches de vous trouver avec le filtre Localisation.", demo: { screen: "Localisation", highlight: "Dakar · Sacré-Cœur", caption: "Les acheteurs filtrent souvent par région." } },
    ],
    tips: ["Ajoutez une photo de couverture qui montre vos produits.", "Indiquez votre politique de retour, même simple."],
    action: { href: "/vendeur/boutique", label: "Compléter ma boutique" },
  },
  {
    key: "choose_domain", title: "Choisir son domaine et ses spécialités", summary: "Être trouvé par les bons acheteurs.", minutes: 2,
    steps: [
      { title: "Un domaine principal", text: "Celui qui représente la majorité de vos ventes.", demo: { screen: "Domaine", highlight: "Beauté et cosmétiques", caption: "Il détermine où votre boutique apparaît." } },
      { title: "Des spécialités précises", text: "Ajoutez 2 à 5 spécialités qui correspondent vraiment à votre catalogue.", demo: { screen: "Spécialités", highlight: "Soins de la peau · Beauté naturelle", caption: "Trop de spécialités brouillent le message." } },
    ],
    tips: ["Vos produits peuvent appartenir à d'autres catégories que vos spécialités."],
    action: { href: "/vendeur/boutique", label: "Choisir mes spécialités" },
  },
  {
    key: "first_products", title: "Ajouter ses premiers produits", summary: "Trois produits bien présentés valent mieux que vingt fiches vides.", minutes: 5,
    steps: [
      { title: "Commencez par vos meilleures ventes", text: "Les produits que vos clients demandent le plus souvent.", demo: { screen: "Nouveau produit", highlight: "Robe wax coupe droite", caption: "Titre : type de produit + détail utile." } },
      { title: "Ajoutez au moins une photo et une catégorie", text: "Ce sont les deux informations obligatoires pour publier. Le reste améliore votre score de présentation.", demo: { screen: "Photos", highlight: "3 photos", caption: "Face, dos, en situation." } },
      { title: "Renseignez le stock et les variantes", text: "Tailles, couleurs, modèles : chaque variante peut avoir son stock et son prix.", demo: { screen: "Variantes", highlight: "M · Bleu — 4 en stock", caption: "Le stock évite les commandes impossibles." } },
      { title: "Publiez", text: "Votre produit apparaît immédiatement dans Explorer et sur votre boutique.", demo: { screen: "Publication", highlight: "Publier", caption: "Vous pouvez le masquer à tout moment." } },
    ],
    tips: ["Publiez au moins 3 produits avant de partager votre boutique."],
    action: { href: "/vendeur/produits/nouveau", label: "Ajouter un produit" },
  },
  {
    key: "improve_presentation", title: "Améliorer ses photos et descriptions", summary: "Le score de présentation vous dit quoi corriger en priorité.", minutes: 6,
    steps: [
      { title: "Photographiez à la lumière du jour", text: "Près d'une fenêtre, sans flash. Fond uni (drap, mur clair). Tenez le téléphone stable.", demo: { screen: "Photo", highlight: "Lumière naturelle", caption: "La netteté compte plus que le décor." } },
      { title: "Montrez plusieurs angles", text: "Face, dos, détail de la matière, produit porté ou en situation.", demo: { screen: "Galerie", highlight: "4 angles", caption: "Chaque photo répond à une question de l'acheteur." } },
      { title: "Décrivez ce qui compte", text: "Dimensions, matière, entretien, ce qui est inclus, délai de livraison. 200 caractères ou plus.", demo: { screen: "Description", highlight: "Coton 100 %, lavage à 30 °C, tailles S à XL", caption: "Une bonne description évite les questions répétées." } },
      { title: "Suivez les conseils du score", text: "Chaque conseil indique combien de points il rapporte. Commencez par le plus important.", demo: { screen: "Score", highlight: "+25 points : ajoutez 2 photos", caption: "Le score ne bloque jamais la publication." } },
    ],
    tips: ["Évitez les photos téléchargées sur internet : elles font fuir les acheteurs avertis.", "Recadrez au format carré ou portrait."],
    action: { href: "/vendeur/produits", label: "Voir mes produits et leur score" },
  },
  {
    key: "share", title: "Partager ses produits", summary: "Vos premiers clients sont dans vos contacts.", minutes: 3,
    steps: [
      { title: "Partagez sur WhatsApp", text: "Le bouton Partager prépare un message avec le lien et l'aperçu de votre produit.", demo: { screen: "Partager", highlight: "WhatsApp", caption: "Le lien ouvre directement la fiche produit." } },
      { title: "Publiez dans votre statut", text: "Copiez le lien de votre boutique et ajoutez-le à votre statut WhatsApp ou à votre page Facebook.", demo: { screen: "Lien", highlight: "msdshoppy…/b/awa-couture", caption: "Un lien unique pour toute votre boutique." } },
      { title: "Promouvoir sur Facebook", text: "Le bouton « Promouvoir sur Facebook » copie votre lien et ouvre le Gestionnaire de publicités. Vous fixez vous-même le budget.", demo: { screen: "Ads Manager", highlight: "Campagne Trafic", caption: "Aucune dépense n'est faite sans votre action." } },
    ],
    tips: ["Partagez un produit précis plutôt que toute la boutique : c'est plus efficace."],
    action: { href: "/vendeur/promouvoir", label: "Partager et promouvoir" },
  },
  {
    key: "understand_stats", title: "Comprendre ses statistiques", summary: "Visites, consultations, contacts, commandes : ce que chaque chiffre signifie.", minutes: 3,
    steps: [
      { title: "Visites et consultations", text: "Une visite = une personne qui ouvre votre boutique. Une consultation = l'ouverture d'une fiche produit. Vos propres visites ne comptent pas.", demo: { screen: "Statistiques", highlight: "124 consultations", caption: "Comptées une fois par session." } },
      { title: "Contacts", text: "Clics sur Appeler et WhatsApp : des acheteurs intéressés qui veulent vous parler.", demo: { screen: "Contacts", highlight: "18 clics WhatsApp", caption: "Répondez vite : la réactivité est mesurée." } },
      { title: "Ventes confirmées", text: "Seules les commandes terminées sur Shoppy by MSD comptent. Une vente conclue uniquement sur WhatsApp n'apparaît pas ici.", demo: { screen: "Ventes", highlight: "6 commandes terminées", caption: "Les commandes annulées ne comptent jamais." } },
    ],
    tips: ["Beaucoup de consultations mais peu de commandes ? Travaillez les photos et le prix."],
    action: { href: "/vendeur/statistiques", label: "Voir mes statistiques" },
  },
  {
    key: "grow_sales", title: "Augmenter ses ventes", summary: "Les habitudes des vendeurs qui réussissent.", minutes: 4,
    steps: [
      { title: "Répondez en moins de 24 heures", text: "Confirmez ou refusez chaque commande rapidement. Le badge « Très réactif » est attribué automatiquement.", demo: { screen: "Commande", highlight: "Confirmer", caption: "La réactivité rassure les nouveaux clients." } },
      { title: "Demandez un avis", text: "Après la livraison, invitez votre client à confirmer la réception : il pourra laisser un avis vérifié.", demo: { screen: "Avis", highlight: "★★★★★", caption: "Les avis viennent uniquement de commandes terminées." } },
      { title: "Tenez votre stock à jour", text: "Un produit en rupture qui reste commandable crée des annulations.", demo: { screen: "Stock", highlight: "Rupture", caption: "Masquez ou mettez en rupture en un geste." } },
      { title: "Ajoutez régulièrement des nouveautés", text: "Les nouveaux produits apparaissent dans la section Nouveautés de l'accueil.", demo: { screen: "Accueil", highlight: "Nouveautés", caption: "Publier chaque semaine entretient la visibilité." } },
    ],
    tips: ["Proposez une option de retrait gratuit si vous avez une boutique physique."],
    action: { href: "/vendeur/commandes", label: "Voir mes commandes" },
  },
];

export interface ProgressFacts {
  hasLogo: boolean; descriptionLength: number; hasContact: boolean; hasLocation: boolean; specialties: number;
  publishedProducts: number; averageQuality: number | null; shares: number;
}

/** Une étape est « faite » si les données le prouvent, ou si le vendeur l'a marquée comme faite. */
export function autoDone(key: string, f: ProgressFacts): boolean {
  switch (key) {
    case "create_shop": return true;
    case "complete_profile": return f.hasLogo && f.descriptionLength >= 80 && f.hasContact && f.hasLocation;
    case "choose_domain": return f.specialties >= 1;
    case "first_products": return f.publishedProducts >= 3;
    case "improve_presentation": return f.publishedProducts > 0 && (f.averageQuality ?? 0) >= 80;
    case "share": return f.shares > 0;
    default: return false;
  }
}

export function progressOf(f: ProgressFacts, manual: Record<string, "done" | "dismissed">) {
  const steps = GUIDES.map((g) => ({ ...g, done: autoDone(g.key, f) || manual[g.key] === "done", dismissed: manual[g.key] === "dismissed" }));
  const done = steps.filter((s) => s.done).length;
  return { steps, done, total: steps.length, next: steps.find((s) => !s.done && !s.dismissed) ?? null };
}
