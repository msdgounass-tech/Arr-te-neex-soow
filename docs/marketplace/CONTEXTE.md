# Marketplace multi-vendeurs — contexte et reprise

Fichier de reprise : à lire en premier dans toute nouvelle session sur la marketplace, avant d'ouvrir d'autres fichiers.
À mettre à jour à la fin de chaque étape (section « Journal »).

## Projet en bref

- Marketplace multi-vendeurs, site web responsive (pas d'application native), marché sénégalais d'abord, extensible à d'autres pays.
- **Nom non choisi : ne jamais en proposer ni en inventer.** Le nom sera une constante de configuration unique.
- Un compte unique par utilisateur, à la fois acheteur et vendeur. Les visiteurs consultent sans compte.
- Navigation mobile en 5 onglets : Accueil, Explorer, Vendre, Favoris, Compte.
- Boutiques : modèle graphique commun, domaine principal + niches, localisation et zones de livraison.
- Produits : photos multiples, variantes (taille, couleur), stock, score de qualité de présentation (distinct de la confiance).
- Confiance : commandes réellement terminées (annulées exclues), avis liés à une commande, note, ancienneté, coordonnées vérifiées, taux de réponse, badges à critères vérifiables.
- Commandes : le vendeur confirme, refuse, prépare, expédie et termine ; paiement et livraison réglés directement avec le vendeur.
- Boutons : Appel, WhatsApp, Commander, Favori ; coordonnées publiques choisies par le vendeur (jamais le numéro privé).
- « Promouvoir sur Facebook » : lien prêt + copie + ouverture de Facebook Ads Manager. Pas d'intégration Meta.
- Assistant vendeur : guides interactifs et conseils contextuels, sans IA externe en V1, ignorables et consultables à tout moment.
- Abonnements : 7 jours d'essai gratuit puis formule payante (tarifs à définir). États : essai, actif, paiement en attente, expiré, suspendu. **Aucune suppression automatique.**
- Design : blanc dominant, orange en accent, texte foncé, gris clair, arrondis légers, mobile d'abord, animations légères (voir `ANIMATIONS.md`).
- Administration centrale : phase séparée, hors V1.
- Objectif : V1 fonctionnelle en 4 à 5 jours.

## Architecture retenue (proposée, en attente de validation)

Next.js (App Router) + TypeScript + Tailwind 4 · Supabase (PostgreSQL + RLS, Auth, Storage) dédié · Vercel · recherche PostgreSQL (`unaccent`, `pg_trgm`) · Resend · Sentry · Motion pour les animations.

## Décisions en attente (posées le 2026-11-25)

1. Dépôt dédié (recommandé) ou sous-dossier de ce dépôt ?
2. Projet Supabase dédié : passer à Pro ou mettre en pause `nder-wouram` (offre gratuite = 2 projets actifs, tous pris) ?
3. Panier multi-boutiques (une commande par boutique) ou commande directe par boutique ?
4. Commande sans compte autorisée ?
5. Boutique après expiration : masquée au public, données conservées (proposé) ?
6. Paiement des abonnements en V1 : lien Wave / Orange Money + validation manuelle ?
7. FCFA et français uniquement en V1 ?

## Points d'attention

- Ce dépôt contient d'autres projets (GOUNASS LUXURY à la racine, `nekh-soow/`, `legacy/`) : **ne pas les modifier**.
- Le projet Supabase `gounass-luxury` héberge déjà quatre applications : ne pas y créer les tables de la marketplace.
- Vercel Hobby interdit l'usage commercial : passer à Pro au lancement public.

## Skills du projet (`.claude/skills/`)

| Quand | Skill |
| --- | --- |
| Créer ou refondre une page, choisir typographie, couleurs, mise en page | `frontend-design` |
| Construire une animation précise | `animate` (+ `RECIPES.md`) |
| Soigner un composant interactif (boutons, menus, gestes, finitions) | `emil-design-eng` |
| Revoir le mouvement d'un lot avant fusion | `/review-animations` (manuel) |

Ne charger un skill que pour la tâche qui le concerne. Les jetons et le catalogue d'animations sont dans `ANIMATIONS.md` :
s'y référer plutôt que relire les skills à chaque fois.

## Méthode de reprise et d'économie de contexte

1. Lire ce fichier, puis seulement les fichiers concernés par l'étape en cours.
2. Travailler par lot (une étape du plan = un ou plusieurs commits ciblés), noter l'avancement dans le journal ci-dessous.
3. Ne pas relire un fichier déjà lu dans la session s'il n'a pas changé ; utiliser `grep` pour retrouver un symbole.
4. Chaque fin d'étape : commit + push sur la branche de travail, puis mise à jour du journal.

## Journal

- **2026-11-25** — Analyse de l'environnement et plan de construction présentés. Installation des skills `frontend-design`, `emil-design-eng`, `animate`, `review-animations` (voir `.claude/skills/SOURCES.md`). Architecture d'animations rédigée (`ANIMATIONS.md`). Aucun code du site écrit. En attente des réponses aux décisions ci-dessus et du feu vert pour le développement.
