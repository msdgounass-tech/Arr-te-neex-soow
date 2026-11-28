# Abonnements et Shoppy AI — plan technique et compte rendu (2026-11-28)

## 1. Audit de l'existant (réutilisé, rien supprimé)

| Existant | Réutilisation |
| --- | --- |
| Abonnement : essai 7 jours, statuts, déclaration Wave / Orange Money, validation admin, rappels, lecture seule à l'expiration | Conservé ; étendu aux formules et au paiement annuel |
| `events` (visites, consultations, appels, WhatsApp, partages, favoris), `seller_stats` | Base de toutes les analyses de Shoppy AI |
| Score qualité des fiches, assistant pédagogique (`/vendeur/assistant`) | Conservés ; le plan d'action s'appuie sur le score qualité |
| RLS + fonctions SECURITY DEFINER, `is_platform_admin`, espace `/admin` | Même modèle de sécurité pour les quotas et l'administration de l'IA |
| Composants UI (cartes, ActionForm, AdminButton, chips, toasts), jetons d'animation | Réutilisés, aucune nouvelle animation lourde |

## 2. Formules

| | Mensuel | Annuel | Avantage | Économie |
| --- | --- | --- | --- | --- |
| Starter | 2 900 F | 31 900 F | 1 mois offert | 2 900 F |
| Pro | 5 000 F | 52 500 F | 1 mois et 15 jours offerts | 7 500 F |
| Business | 12 000 F | 120 000 F | 2 mois offerts | 24 000 F |

Règles (en base, testées) :
- le montant est calculé par la base, jamais envoyé par le navigateur ;
- un seul paiement en attente à la fois, donc pas de double facturation ;
- la validation ajoute 30 ou 365 jours à la fin de la période en cours ;
- la formule change à la validation : une mise à niveau est immédiate, une baisse prend effet au paiement suivant ;
- pendant l'essai, toutes les fonctions Pro sont ouvertes ;
- à l'expiration, rien n'est supprimé : boutique masquée, gestion en lecture seule, Shoppy AI en pause ;
- les rappels avant échéance existent déjà (migration 5) ;
- aucune période de grâce n'est ajoutée, pour rester conforme aux règles existantes. Si vous en voulez une, il suffit de modifier `subscription_effective_status`.

Droits par formule : table `plan_features` (niveau `none`, `basic`, `full` ou `advanced`, plus un quota mensuel), réglable depuis `/admin/ia`. Chaque module peut aussi être coupé en urgence (`ai_modules`).

## 3. Shoppy AI — modules

| Module | Source | État |
| --- | --- | --- |
| Vue d'ensemble (résumé, alertes, actions, quotas) | Données réelles | Terminé |
| Mes ventes : meilleures ventes, produits sans vente, conversion, comparaison de périodes, jours actifs, constats avec niveau de confiance | Données réelles | Terminé |
| Mon stock : ruptures, stock faible avec jours de couverture estimés, incohérences, produits dormants | Données réelles | Terminé |
| Mes prix : marge, prix minimum pour une marge cible, simulation prix et promotion, comparaison aux prix publics Shoppy | Données réelles, coûts privés | Terminé |
| Produits gagnants : demande ou offre par catégorie, tendance, recherches mal couvertes | Données Shoppy agrégées et anonymes | Terminé (Shoppy uniquement) |
| Mes concurrents : prix publics, promotions, catégories manquantes, boutiques du domaine | Données publiques Shoppy | Terminé (Shoppy uniquement) |
| Mon plan d'action : recommandations hebdomadaires ; accepter, écarter, reporter, terminer, historique | Règles sur données réelles | Terminé |
| Créer mes produits : photo et notes, puis titre, description, catégorie, mots-clés, arguments et « à vérifier » | IA générative (vision) | Terminé, actif dès que la clé est posée |
| Mes publicités : WhatsApp, Facebook, Instagram, variantes, script vidéo et voix off, publics, conseils visuels | IA générative | Terminé, actif dès que la clé est posée |
| Traduction français, anglais, wolof | IA générative | Terminé, actif dès que la clé est posée |
| Poser une question : réponse appuyée sur les données de la boutique, limites et historique | IA générative + données | Terminé, actif dès que la clé est posée |
| Fidéliser : note moyenne, avis à traiter, clients réguliers, réponse aux clients | Données + IA | Terminé (relances : à venir) |
| Export CSV produits et commandes (Business) | Données réelles | Terminé |

## 4. Architecture et sécurité

- **Fournisseur d'IA**
  - Fichier `src/lib/ai/provider.ts`, interface `AiProvider`.
  - Implémentation Anthropic avec le SDK officiel.
  - Sorties structurées validées par zod.
  - Repli automatique en cas de refus.
  - Mise en cache du prompt système.
- **Clé API** : uniquement côté serveur (`ANTHROPIC_API_KEY`, dans les variables Vercel). Elle n'apparaît jamais dans le navigateur.
- **Point d'entrée unique** : `POST /api/ai`, qui enchaîne :
  1. authentification ;
  2. validation de l'entrée ;
  3. contexte construit côté serveur, avec les seules données autorisées par RLS ;
  4. cache de 7 jours (une même demande ne consomme pas de quota) ;
  5. `ai_reserve` (formule, module, quota mensuel, maximum 8 demandes par minute) ;
  6. appel au modèle ;
  7. `ai_finalize` (jetons, coût en dollars, statut). Une génération en erreur ne consomme pas de quota.
- **Historique** : la table `ai_usage` garde les sorties ; elle n'est lisible que par la boutique et l'administrateur.
- **Données privées** :
  - `product_costs` : coûts d'achat, lisibles par le seul propriétaire ;
  - `search_log` : recherches, sans compte ni adresse IP.
- **Validation humaine** : aucune action ne modifie un prix, un stock ou une fiche automatiquement. Tout passe par le vendeur.

## 5. Coûts de l'IA — décision à prendre

Hypothèses : 1 $ ≈ 600 FCFA ; jetons estimés pour chaque type de demande.

| Demande | Opus 5.5 (4 $ / 20 $ par million de jetons) | Sonnet 5.5 (2 $ / 10 $) | Haiku 5.5 (0,10 $ / 0,50 $) |
| --- | --- | --- | --- |
| Fiche produit avec photo (≈ 3 500 jetons d'entrée, 700 de sortie) | ≈ 0,03 $ (17 F) | ≈ 0,014 $ (8 F) | ≈ 0,0007 $ (0,4 F) |
| Question au conseiller (≈ 6 000 d'entrée, 2 500 de sortie) | ≈ 0,07 $ (45 F) | ≈ 0,04 $ (22 F) | ≈ 0,002 $ (1 F) |
| Pro au quota maximal (200 + 100 + 100 + 100 demandes) | ≈ 17 $ (≈ 10 000 F) | ≈ 8 $ (≈ 5 000 F) | ≈ 0,5 $ (≈ 300 F) |

Le modèle par défaut du code est Opus 5.5, le plus capable. Mais un vendeur Pro qui utiliserait tout son quota coûterait plus cher que son abonnement (5 000 F).

Recommandation :
- poser `SHOPPY_AI_MODEL=claude-haiku-5-5` dans les variables Vercel ;
- sinon, réduire les quotas dans `/admin/ia`.

Rien n'est dépensé tant que la clé n'est pas configurée. Le coût réel de chaque génération s'affiche dans `/admin/ia`.

## 6. À faire / dépendances externes

- **Activer l'IA** :
  - créer une clé sur console.anthropic.com (payant à l'usage) ;
  - l'ajouter dans Vercel : `ANTHROPIC_API_KEY` ;
  - y ajouter aussi, en option, `SHOPPY_AI_MODEL`.
- **Pas encore développé** (affiché « Bientôt » dans les formules, jamais présenté comme acquis) :
  - coupons et promotions ;
  - mise en avant payante ;
  - relance des clients consentants ;
  - employés, rôles et permissions ;
  - campagnes sponsorisées.
- **Connecteurs non branchés** :
  - réseaux sociaux, Google Trends, sites concurrents externes ;
  - API Meta et Google Ads ;
  - les modules marché et concurrence se limitent donc aux données Shoppy, et l'indiquent.
- **Paiement automatique** : Wave / Orange Money par API, après obtention d'un accès marchand.

## 7. Tests

- **Base de données** : 27 nouveaux tests (96 au total) dans `supabase/tests/business.test.sql`, tous réussis. Ils couvrent :
  - les tarifs ;
  - le montant calculé par la base ;
  - le paiement annuel sur 365 jours ;
  - l'absence de double facturation ;
  - les droits Starter et Pro ;
  - le quota épuisé ;
  - l'erreur qui ne consomme pas de quota ;
  - la désactivation d'un module ;
  - les droits réservés à l'administrateur ;
  - la confidentialité des coûts, des plans d'action et de l'utilisation de l'IA ;
  - le blocage des visiteurs ;
  - le journal des recherches.
- **Tests unitaires** : 21 tests (marges, prix minimum, couverture de stock, constats, économies annuelles).
- **Navigateur, mobile 390 px** : les 10 pages de Shoppy AI et la page Abonnement s'affichent sans débordement ni erreur. Vérifiés aussi :
  - la génération du plan d'action ;
  - la bascule annuelle ;
  - la réponse claire de `/api/ai` quand l'IA n'est pas configurée.
- **Non testé** : la génération réelle par l'IA, faute de clé.
