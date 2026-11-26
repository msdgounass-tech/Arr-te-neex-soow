// Contenus du centre d'aide (intégrés au site, modifiables sans base de données).
export interface HelpArticle { slug: string; title: string; summary: string; audience: "clients" | "vendeurs" | "tous"; sections: { heading: string; body: string[] }[] }

export const FAQ: { q: string; a: string }[] = [
  { q: "Faut-il un compte pour consulter les produits ?", a: "Non. Vous pouvez parcourir les boutiques et les produits librement. Un compte est nécessaire pour commander, suivre vos commandes et laisser un avis." },
  { q: "Comment se passe le paiement ?", a: "Le paiement se fait directement avec le vendeur : à la livraison, au retrait, ou par Wave / Orange Money selon ses indications. MSD Shoppy n'encaisse aucune somme pour les achats." },
  { q: "Que se passe-t-il après ma commande ?", a: "Le vendeur reçoit une notification et confirme ou refuse votre commande. Vous suivez chaque étape (confirmée, en préparation, expédiée, livrée) dans Mon compte > Mes commandes." },
  { q: "Puis-je annuler une commande ?", a: "Oui, tant qu'elle n'est pas en préparation. Ouvrez la commande dans votre compte et touchez « Annuler la commande »." },
  { q: "Comment laisser un avis ?", a: "Une fois votre commande reçue, confirmez la réception dans votre compte. Vous pourrez alors noter la boutique. Seuls les clients dont la commande est terminée peuvent laisser un avis." },
  { q: "Mes favoris sont-ils sauvegardés ?", a: "Sans compte, ils restent sur votre appareil. Une fois connecté, ils sont rattachés à votre compte et disponibles sur tous vos appareils." },
  { q: "Combien coûte l'ouverture d'une boutique ?", a: "Les 7 premiers jours sont gratuits. Ensuite, un abonnement est nécessaire pour garder la boutique visible. Les formules seront annoncées avant la fin de votre essai." },
  { q: "Que devient ma boutique si mon abonnement expire ?", a: "Elle devient temporairement invisible et la gestion passe en lecture seule. Rien n'est supprimé : produits, commandes et historique sont conservés jusqu'à la réactivation." },
  { q: "Mon numéro personnel est-il visible ?", a: "Non. Seuls les numéros que vous choisissez comme coordonnées publiques de votre boutique sont affichés. Le téléphone de votre compte reste privé." },
  { q: "Comment signaler un problème ou un vendeur ?", a: "Utilisez le formulaire « Signaler un problème » du centre d'aide. Indiquez le lien de la page concernée pour un traitement plus rapide." },
];

export const ARTICLES: HelpArticle[] = [
  { slug: "guides-clients", title: "Guide d'achat", summary: "Trouver un produit, commander et suivre sa livraison.", audience: "clients", sections: [
    { heading: "Trouver un produit", body: ["Utilisez la recherche de l'accueil ou l'onglet Explorer. Filtrez par domaine, catégorie, prix, région ou disponibilité.", "Sur chaque fiche, consultez le profil de confiance du vendeur : commandes terminées, avis vérifiés et badges."] },
    { heading: "Commander", body: ["Ajoutez les produits au panier, puis touchez « Passer la commande ». Si votre panier contient plusieurs boutiques, une commande est envoyée à chacune.", "Choisissez le mode de livraison proposé par chaque vendeur et votre moyen de paiement. Le récapitulatif affiche le total avant l'envoi."] },
    { heading: "Suivre et recevoir", body: ["Chaque changement de statut vous est notifié. À la réception, confirmez-la dans votre compte : cela termine la commande et vous permet de laisser un avis."] },
  ] },
  { slug: "guides-vendeurs", title: "Guide du vendeur", summary: "Ouvrir sa boutique, publier ses produits, gérer ses commandes.", audience: "vendeurs", sections: [
    { heading: "Ouvrir sa boutique", body: ["Touchez Vendre, créez votre compte puis votre boutique en trois étapes : identité, activité, coordonnées publiques. L'essai gratuit de 7 jours démarre aussitôt."] },
    { heading: "Publier ses produits", body: ["Pour publier, deux informations sont obligatoires : une catégorie et au moins une photo. Le score de présentation vous indique ensuite comment améliorer la fiche.", "Ajoutez des variantes (taille, couleur, modèle) avec leur propre stock et, si besoin, leur propre prix."] },
    { heading: "Gérer ses commandes", body: ["Confirmez ou refusez chaque commande, idéalement en moins de 24 heures. Faites-la ensuite avancer : préparation, expédition, livraison.", "Le stock réservé par une commande refusée ou annulée est automatiquement remis en vente."] },
    { heading: "L'assistant vendeur", body: ["Dans votre espace vendeur, l'assistant vous guide étape par étape, avec des démonstrations. Vous pouvez ignorer une étape et la reprendre à tout moment."] },
  ] },
  { slug: "confiance", title: "Comment fonctionne la confiance", summary: "Commandes terminées, avis vérifiés et badges : tout est calculé sur des faits.", audience: "tous", sections: [
    { heading: "Fiabilité de la boutique", body: ["Commandes terminées : seules les commandes passées sur MSD Shoppy et menées à terme comptent. Les commandes annulées ou refusées, et les ventes conclues uniquement sur WhatsApp, ne sont pas comptées.", "Avis : uniquement de la part de clients dont la commande est terminée, un avis par commande.", "Taux de réponse : part des commandes confirmées ou refusées en moins de 24 heures, affiché à partir de 5 commandes."] },
    { heading: "Badges", body: ["Vendeur confirmé : au moins 5 commandes terminées et une note moyenne de 4/5 ou plus sur 3 avis minimum.", "Très réactif : 90 % de réponses en moins de 24 heures.", "Boutique établie : plus de 6 mois d'activité.", "Boutique vérifiée : attribué par l'équipe MSD Shoppy après contrôle des coordonnées.", "Un vendeur ne peut ni acheter ni s'attribuer un badge."] },
    { heading: "Qualité de présentation des produits", body: ["Distincte de la confiance, elle évalue les photos, le titre, la description, le prix, la catégorie et la disponibilité. Elle aide le vendeur à améliorer ses fiches et ne bloque jamais une publication."] },
  ] },
  { slug: "abonnements", title: "Abonnements vendeurs", summary: "Essai gratuit, formules, expiration : ce qu'il faut savoir.", audience: "vendeurs", sections: [
    { heading: "Essai gratuit", body: ["Chaque nouvelle boutique bénéficie de 7 jours d'essai avec toutes les fonctions vendeur. Aucun paiement n'est demandé à l'inscription."] },
    { heading: "Après l'essai", body: ["Une formule payante est nécessaire pour garder la boutique visible. Le paiement se fait par Wave ou Orange Money ; vous déclarez la référence de transaction et l'abonnement est activé après vérification.", "Les frais d'abonnement sont distincts de vos ventes : aucune commission n'est prélevée sur vos produits."] },
    { heading: "Expiration", body: ["La boutique devient temporairement invisible et la gestion passe en lecture seule. Aucune donnée n'est supprimée. Vous pouvez continuer à traiter les commandes déjà reçues."] },
  ] },
  { slug: "conditions", title: "Conditions d'utilisation", summary: "Les règles de la plateforme.", audience: "tous", sections: [
    { heading: "Rôle de MSD Shoppy", body: ["MSD Shoppy met en relation des acheteurs et des vendeurs indépendants. Chaque vendeur est responsable de ses produits, de ses prix, de la livraison et du service après-vente.", "Le paiement des achats se fait directement entre l'acheteur et le vendeur."] },
    { heading: "Règles de publication", body: ["Sont interdits : les produits illicites, contrefaits ou dangereux, les contenus trompeurs, les photos ne correspondant pas au produit, et toute tentative de manipulation des avis ou des statistiques.", "MSD Shoppy peut masquer un produit ou suspendre une boutique qui ne respecte pas ces règles."] },
    { heading: "Comptes", body: ["Vous êtes responsable de la confidentialité de votre mot de passe. Vous pouvez supprimer votre compte à tout moment depuis Sécurité du compte."] },
    { heading: "Version", body: ["Ces conditions sont une version de lancement. Elles seront complétées (mentions légales, politique de retour et de réclamation) avant l'ouverture publique."] },
  ] },
  { slug: "confidentialite", title: "Confidentialité", summary: "Quelles données sont utilisées, et pourquoi.", audience: "tous", sections: [
    { heading: "Données collectées", body: ["Compte : nom, e-mail, téléphone (privé). Commandes : coordonnées de livraison partagées avec le seul vendeur concerné. Statistiques : visites et clics anonymes par boutique, sans profil individuel."] },
    { heading: "Vos droits", body: ["Vous pouvez modifier vos informations et supprimer votre compte à tout moment. Les commandes passées sont conservées de façon anonymisée pour les vendeurs concernés.", "Conformément à la loi sénégalaise n° 2008-12 sur la protection des données personnelles, vous pouvez demander l'accès à vos données via le formulaire d'assistance."] },
    { heading: "Ce que nous ne faisons pas", body: ["Nous n'affichons jamais votre numéro personnel. Nous ne vendons pas vos données. Aucun traceur publicitaire n'est installé par défaut."] },
  ] },
];
