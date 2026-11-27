# Shoppy by MSD

Marketplace multi-vendeurs pour le Sénégal : chaque vendeur ouvre sa boutique, publie ses produits et reçoit des commandes ;
les acheteurs parcourent le catalogue sans compte, commandent directement et suivent leurs commandes.

| Couche | Choix | Pourquoi |
| --- | --- | --- |
| Site | Next.js 15.5 (App Router), React 19, TypeScript, Tailwind 4 | Même pile que les autres projets du dépôt, rendu serveur pour le SEO |
| Données, comptes, images | Supabase (PostgreSQL + RLS, Auth, Storage) | Isolation des vendeurs dans la base, offre gratuite pour démarrer |
| Animations | Motion 14.12 (chargé à la demande) + CSS | Une seule bibliothèque, voir `../docs/marketplace/ANIMATIONS.md` |
| Validation | Zod (serveur) + contrôles en base | Rien de sensible n'est décidé par le navigateur |
| Polices | Bricolage Grotesque + Onest, auto-hébergées | Aucun appel externe au chargement |

Dépendances de production : 8 paquets (`next`, `react`, `react-dom`, `@supabase/ssr`, `@supabase/supabase-js`, `motion`, `zod`, `server-only`) + 2 polices.

## Fonctionnalités

**Acheteurs** — accueil (recherche, catégories, nouveautés, populaires, recommandés, boutiques), Explorer (recherche produits et boutiques, filtres domaine, catégorie, prix, région, disponibilité, tri), fiches produit (galerie, variantes, stock, WhatsApp prérempli avec titre et référence, appel, partage, favori, confiance simplifiée, livraison, données structurées), pages boutique (profil de confiance complet, avis vérifiés, livraison, catalogue, suivi de la boutique), favoris (appareil puis compte), panier multi-boutiques revérifié en base, commande (une par boutique, zone de livraison par boutique, paiement direct au vendeur), suivi avec frise, annulation, confirmation de réception, avis, compte (profil, commandes, adresses, notifications, paramètres, sécurité, suppression du compte), centre d'aide.

**Vendeurs** — parcours « Vendre » intelligent, création de boutique en 3 étapes avec essai de 7 jours, tableau de bord (chiffres réels uniquement), produits (photos compressées, réordonnables, variantes taille/couleur/modèle avec prix et stock, référence, disponibilité, brouillon/publication/masquage/suppression, score de qualité en direct), commandes (confirmer, refuser avec motif, préparer, expédier, livrer, terminer, historique, contact du client), boutique (identité, couverture, spécialités, coordonnées publiques, politique de retour, fermeture temporaire), livraison (zones, modes, frais, délais), statistiques 7/30/90 jours, confiance et qualité, promotion (partage, « Promouvoir sur Facebook »), assistant (8 étapes, guides, démonstrations, ignorer/reprendre), abonnement (statut, déclaration de paiement, historique).

## Sécurité — ce que garantit la base

- RLS sur toutes les tables. Un vendeur ne voit que ses produits, commandes et statistiques ; un client que ses commandes, adresses et favoris.
- Prix, stock et frais de livraison relus par `place_orders` ; le prix envoyé par le navigateur est ignoré. Un vendeur ne peut pas commander chez lui.
- Transitions de commande contrôlées par `set_order_status` (pas d'étape sautée, motif obligatoire pour un refus, remise en stock automatique).
- Avis uniquement pour une commande terminée, un par commande. Confiance, badges et score qualité calculés en base, jamais modifiables par le vendeur.
- Abonnement : aucune écriture directe ; activation uniquement par `admin_review_subscription_payment` (administrateur de la plateforme). Expiration = boutique masquée, données conservées.
- Images : envoyées par le serveur après vérification du propriétaire, du format et des dimensions réelles (lecture des en-têtes).

Ces règles sont couvertes par **58 tests** (`scripts/test-db.sh`).

## Installation

```bash
cd msd-shoppy
npm install
cp .env.example .env.local    # renseigner les clés Supabase
npm run dev                   # http://localhost:3000
```

### Base de données Supabase (projet dédié)

1. Créez un projet Supabase dédié à Shoppy by MSD (région `eu-west`). Ne réutilisez pas un projet existant : les noms de tables et les comptes seraient partagés.
2. Appliquez les migrations dans l'ordre : `supabase/migrations/*.sql`, puis `supabase/seed.sql` (pays, 14 régions, 8 domaines, 43 catégories). Avec la CLI : `npx supabase link --project-ref <ref>` puis `npx supabase db push` et l'exécution de `seed.sql`.
3. **Authentication > URL Configuration** : Site URL = votre domaine ; Redirect URLs = `https://votre-domaine/auth/callback`, `http://localhost:3000/auth/callback`.
4. Laissez la confirmation d'e-mail activée et configurez un SMTP (Resend, Brevo…) pour les e-mails d'inscription.
5. Le bucket `media` (public, 5 Mo, WebP/JPEG/PNG) est créé par la migration `20261126000004_storage.sql`.
6. Administrateur de la plateforme : `update public.profiles set is_platform_admin = true where id = (select id from auth.users where email = '…');`

### Tests

```bash
npm test                                  # tests unitaires (format, qualité, assistant, images, jetons d'animation)
PGPORT=54322 scripts/test-db.sh           # migrations + 58 tests métier et sécurité sur un PostgreSQL local vierge
npm run typecheck && npm run build
```

`supabase/tests/supabase_shim.sql` reproduit les rôles et `auth.uid()` de Supabase pour tester sur un PostgreSQL ordinaire. Ne jamais l'exécuter sur un vrai projet.

## Activer un abonnement (en attendant l'écran d'administration)

Le vendeur déclare sa référence Wave ou Orange Money dans **Espace vendeur > Abonnement**. Un administrateur vérifie le paiement, puis exécute (connecté avec un compte `is_platform_admin`) :

```sql
select public.admin_review_subscription_payment('<id du paiement>', true, 30);   -- false pour refuser
select public.admin_set_shop_verified('<id de la boutique>', true);              -- badge « Boutique vérifiée »
```

Les formules (`subscription_plans`) sont vides : aucun tarif n'est fixé tant qu'il n'est pas validé.

## Déploiement (non effectué)

Vercel : importer le dépôt avec **Root Directory = `msd-shoppy`**, ajouter les variables de `.env.example`. L'offre Hobby de Vercel interdit l'usage commercial : passer à Pro avant l'ouverture publique.
