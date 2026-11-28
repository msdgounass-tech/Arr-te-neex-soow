# Shoppy by MSD — contexte et reprise

Fichier de reprise : à lire en premier dans toute nouvelle session, avant d'ouvrir d'autres fichiers.
À mettre à jour à chaque étape importante (section « Journal »).

## Projet

- **Nom officiel : Shoppy by MSD.** Marketplace multi-vendeurs, site responsive mobile d'abord, Sénégal d'abord (extensible : table `countries`).
- Un compte = acheteur et vendeur. Consultation libre sans compte. Navigation mobile : Accueil, Explorer, **Vendre** (centre, mis en avant), Favoris, Compte.
- Code : `msd-shoppy/` (application Next.js autonome). Documentation technique : `msd-shoppy/README.md`. Animations : `docs/marketplace/ANIMATIONS.md`.

## Décisions techniques prises (carte blanche du propriétaire, 2026-11-26)

| Question | Décision | Raison |
| --- | --- | --- |
| Dépôt | Sous-dossier `msd-shoppy/` de ce dépôt | Seul dépôt accessible à cette session ; déplaçable tel quel dans un dépôt dédié |
| Base de données | Supabase **dédié** (à créer) ; jamais `gounass-luxury` (4 applications, tables `products`/`orders` déjà prises) | Isolation des données et des comptes |
| Panier | Multi-boutiques, **une commande par boutique** | Chaque vendeur gère ses commandes ; frais de livraison par boutique |
| Commande sans compte | **Non** (consultation libre, commande avec compte) | Avis vérifiés, suivi, notifications |
| Expiration de l'abonnement | Boutique masquée, gestion en lecture seule, commandes en cours toujours traitables, **rien n'est supprimé** | Demande du cahier des charges |
| Paiement des abonnements (V1) | Le vendeur déclare la référence Wave / Orange Money → statut « paiement en attente » → validation par un administrateur | Aucun paiement simulé ; API Wave/Orange Money à brancher plus tard |
| Paiement des achats | Directement au vendeur (à la livraison, Wave, Orange Money) | Shoppy by MSD n'encaisse rien en V1 |
| Fin de commande | Vendeur : livrée → terminée ; ou client : « J'ai bien reçu » (expédiée/livrée → terminée) | Seules les commandes terminées comptent comme ventes |
| Badges | Calculés en base : e-mail confirmé, vendeur confirmé (5 commandes, 3 avis ≥ 4/5), très réactif (90 % < 24 h), établie (6 mois) ; « vérifiée » par l'admin | Critères vérifiables, non attribuables par le vendeur |
| Qualité des fiches | Score 0–100 en base (photos 30, titre 15, description 25, prix 10, catégorie 10, disponibilité 10) ; obligatoire pour publier : catégorie + 1 photo | Ne bloque jamais au-delà de l'obligatoire |
| Statistiques | Événements réels (visites, consultations, appels, WhatsApp, partages, favoris), 1 fois par session, visites du vendeur exclues | Aucune statistique inventée |
| Langue / monnaie | Français, FCFA (XOF) | V1 Sénégal |
| Tarifs | Aucun (table `subscription_plans` vide) | À valider par le propriétaire |
| Ambiance sonore | Composée en Web Audio, désactivée par défaut, jamais de démarrage automatique | Aucun fichier, aucun impact sur le chargement |

## État au 2026-11-26

Construit et vérifié : base (5 migrations, 58 tests métier/sécurité), 44 routes, 16 tests unitaires, compilation de production, captures mobile/ordinateur.
Revue des animations : `/review-animations` en 3 passes — Bloquer, Bloquer, puis **Approuver** (détail dans `ANIMATIONS.md`, section 10). Accessibilité : axe-core, 0 violation WCAG A/AA sur 10 pages.

**Bloquant pour les tests de bout en bout avec de vraies données** : aucun projet Supabase dédié n'existe encore
(offre gratuite = 2 projets actifs, déjà utilisés) et l'environnement cloud refuse le téléchargement des binaires Supabase locaux.

## Reste à faire (prochaines phases)

- Créer le projet Supabase dédié, appliquer les migrations, configurer l'e-mail (SMTP), puis tester les parcours complets en navigateur.
- Écran d'administration de la plateforme (validation des paiements d'abonnement, vérification des boutiques, modération, catégories).
- Formules et tarifs d'abonnement ; intégration Wave / Orange Money après accès marchand.
- Codes promo, mise en avant payante, fidélité ; retours, remboursements, réclamations (`shops.return_policy` déjà prévu).
- Suivi des erreurs (Sentry) et sauvegardes (`pg_dump` planifié) au moment du déploiement.

## Skills du projet (`.claude/skills/`)

| Quand | Skill |
| --- | --- |
| Créer ou refondre une page | `frontend-design` |
| Construire une animation | `animate` (+ `RECIPES.md`) |
| Finitions d'un composant interactif | `emil-design-eng` |
| Contrôler les animations d'un lot | `/review-animations` (manuel ; en session automatique : `claude -p "/review-animations …"`) |

## Méthode de reprise

1. Lire ce fichier, puis `msd-shoppy/README.md` si besoin de détails ; n'ouvrir que les fichiers de l'étape en cours.
2. Base de test locale : `pg_createcluster 16 shoppy --port 54322 && pg_ctlcluster 16 shoppy start`, puis `PG_AS=postgres msd-shoppy/scripts/test-db.sh`.
3. `cd msd-shoppy && npm install && npm test && npx tsc --noEmit && npx next build`.
4. Chaque fin d'étape : commit + push sur la branche de travail, mise à jour du journal.

## Mise en ligne (2026-11-26)

- Supabase : projet `msd-shoppy` (réf. `anpmpveswepsfpdyewxv`, Paris), gratuit. `nder-wouram` mis en pause (réactivable).
  Installé : schéma, fonctions, RLS (39 règles), stockage `media`, rappels, données de référence, durcissement (migration 6).
  **Reste** : fonction `delete_my_account` (la confirmation Supabase n'a pas abouti via l'outil), à exécuter dans le SQL Editor.
- Vercel : projet `msd-shoppy` (équipe msd-tech), racine `msd-shoppy`, Node 22, région cdg1, variables publiques posées.
  **Reste** : autoriser l'application GitHub de Vercel sur le dépôt, puis brancher le dépôt (branche `ccr-9ced9e68-fhugy8`) ;
  ajouter `SUPABASE_SERVICE_ROLE_KEY` (secret, envoi des photos) dans Vercel.
- Auth Supabase : le service d'e-mail par défaut n'envoie qu'aux membres de l'équipe → brancher un SMTP (Resend ou Brevo, gratuits)
  et régler Site URL / Redirect URLs sur l'adresse Vercel. (Badge « E-mail confirmé » retiré en migration 7 : la confirmation peut rester désactivée.)

## En ligne

- Adresse principale : **https://shoppy-by-msd.vercel.app** (2026-11-27) ; l'ancienne https://msd-shoppy.vercel.app reste active.
  `NEXT_PUBLIC_SITE_URL` et Site URL Supabase pointent sur la nouvelle ; les deux sont dans les Redirect URLs.

- **https://msd-shoppy.vercel.app** (production, protégée par l'authentification Vercel de l'équipe msd-tech tant que l'ouverture au public n'est pas décidée).
- Déploiement : envoi direct par l'API Vercel (jeton d'équipe msd-tech enregistré comme secret réseau de l'environnement cloud) ;
  le dépôt GitHub n'est pas relié (compte GitHub de Vercel = MSD18gns, dépôt = msdgounass-tech).

## Administration et démo (2026-11-26)

- Espace **/admin** réservé aux profils `is_platform_admin` (compte propriétaire msdgounass@… créé confirmé). Lecture complète via RLS `admin_read`,
  actions via fonctions `admin_*` (migration 9). Pages : vue d'ensemble, paiements, boutiques, produits, commandes, utilisateurs, signalements, avis.
- Mode démo : `NEXT_PUBLIC_DEMO_MODE=1` sur Vercel, page **/demo**, 6 comptes `@demo.msdshoppy.sn` (mot de passe DemoMSD2026),
  boutiques `is_demo`. Scripts : `scripts/demo/*`. Suppression : `supabase/demo/remove_demo.sql`.
- Inscriptions publiques : **ouvertes** (2026-11-26) — « Confirm email » désactivé, liaison manuelle et connexions anonymes désactivées.
  Testé : inscription → session immédiate + profil créé (compte de test supprimé). Site URL = https://msd-shoppy.vercel.app, Redirect URLs = https://msd-shoppy.vercel.app/** (réglés par l'API de gestion).
  Jeton Supabase (Project Settings + Auth Config en écriture, projet msd-shoppy, 90 j) enregistré comme secret réseau pour api.supabase.com.
  SMTP Brevo branché (2026-11-28) : smtp-relay.brevo.com:587, identifiant c57d0b001@smtp-brevo.com, expéditeur « Shoppy by MSD » <msdgounass@gmail.com>,
  30 e-mails/h, blocage IP Brevo désactivé pour les clés SMTP. Modèles d'e-mails en français. Test « mot de passe oublié » : envoyé (200).
  À faire : régénérer la clé SMTP (elle a été écrite dans le chat) et la recoller dans Supabase › Auth › SMTP.

## Journal

- **2026-11-25** — Analyse de l'environnement, plan, installation des 4 skills, architecture d'animations, vérification technique (maquette Motion testée, 3 corrections).
- **2026-11-26** — Développement de Shoppy by MSD : schéma, RLS et fonctions métier (58 tests) ; design system (orange #F26B1D / #C9480B, encre #1C2230, Bricolage Grotesque + Onest) ; expérience client complète ; espace vendeur complet avec assistant ; abonnements (essai, déclaration, rappels) ; promotion Facebook ; centre d'aide ; SEO (métadonnées, JSON-LD Product/Store, sitemap, robots, aperçu Open Graph). Aucun déploiement.
