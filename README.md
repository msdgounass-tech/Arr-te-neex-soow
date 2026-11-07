# GOUNASS High-Tech — *La technologie, en version premium*

Boutique e-commerce **high-tech** pour le Sénégal : smartphones, tablettes, informatique, audio, objets connectés, TV & gaming, accessoires. Prix en FCFA/XOF, site en français, commande en ligne ou sur WhatsApp.
Direction artistique **« Graphite & Ion »** : fond graphite `#07080B`, surfaces vitrées `#0E1015` / `#161922`, texte `#EEF1F6`, un seul accent bleu ionique `#7EA4FF` (reflet cyan `#63E6D2` utilisé avec parcimonie). Titres en Sora, texte en Manrope.

| Couche | Technologie |
| --- | --- |
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| Animations | Framer Motion (défilement, transitions), animations CSS (entrées, sans attendre JavaScript) |
| 3D | Three.js + React Three Fiber (smartphone procédural du Hero, chargé en différé) |
| Données | Supabase : PostgreSQL, Auth, Storage, Row Level Security |
| Paiements | Wave Checkout, Orange Money (API Sonatel), carte bancaire (Stripe Checkout), paiement à la livraison |
| Notifications | WhatsApp Business Cloud API, e-mail (Resend, facultatif) |
| Tests | Tests unitaires (node:test), tests de bout en bout Playwright (ordinateur et mobile) |
| Hébergement | Vercel |

Le nom affiché, la signature et le nom commercial légal se règlent à un seul endroit : `BRAND` dans `src/lib/site.ts`.

### Passage de la mode au high-tech : à faire au moment de la mise en ligne

La base de production contient encore le catalogue de mode (51 produits, 3 commandes). La nouvelle version a été préparée **sans rien supprimer** :

1. `supabase/migrations/0010_high_tech.sql` — **déjà appliquée** : ajout de `products.brand`, de `products.specs` (caractéristiques techniques) et des catégories high-tech (6 univers, 15 types). Elle est sans effet sur le site actuel.
2. `supabase/migrations/0011_bascule_high_tech.sql` — **à exécuter juste après le déploiement** de cette version (SQL Editor de Supabase). Elle **masque** (sans supprimer) les produits, catégories et collections de mode, et remplace le bandeau d'annonce « Wouro Maama ». Les commandes passées restent intactes. Retour en arrière : repasser `is_active` à `true`.
3. Ajouter les vrais produits dans **Admin › Produits** : marque, photos, versions (128 Go, 8/256 Go…), couleurs, stock et **caractéristiques techniques officielles**. Aucune fiche ni aucune caractéristique n'a été inventée.

---

## 1. Fonctionnalités

**Boutique**
- Accueil cinématique : Hero avec **smartphone 3D réel** (Three.js) qui pivote, suit la souris, réagit au défilement et au glisser, avec les angles Face / Profil / Dos ; boutons « Découvrir nos produits » et « Commander sur WhatsApp ». Puis : grille des univers, nouveautés, meilleures ventes, engagements révélés au défilement, promotions, un rayon par univers, collection vedette, conseil WhatsApp, newsletter.
- La 3D est chargée **après** l'affichage de la page, se met en pause hors écran et n'est activée qu'avec une vraie accélération graphique. Sans GPU, en mode économie de données ou sur un appareil très modeste, une silhouette statique la remplace. Ajouter `?3d` à l'adresse force la 3D (démonstration, tests).
- Navigation : méga-menu « Catalogue » alimenté par les catégories de la base, liens rapides vers les premiers univers, menus Offres et Aide, menu mobile en accordéon, recherche instantanée (**Ctrl+K** ou **/**, flèches et Entrée), compte, favoris, panier animé, bouton WhatsApp flottant.
- Catalogue : `/shop` et `/categorie/[slug]` (univers ou type), filtres univers, **marque**, prix (fourchettes rapides ou min/max), tri, pagination, fil d'Ariane. Les anciennes adresses de mode (`/men`, `/women`, `/montres`…) sont redirigées.
- Cartes produit : marque, prix et prix barré, disponibilité, coloris, favoris, **ajout rapide** au panier quand le produit n'a qu'une déclinaison.
- Fiche produit : galerie (balayage tactile, zoom, plein écran), versions et couleurs avec stock par déclinaison, quantité, ajout au panier, achat immédiat, **commande WhatsApp pré-remplie** (produit, version, couleur, quantité, prix, référence, lien), barre d'achat collante sur mobile, **caractéristiques techniques**, produits similaires, données structurées `Product` et `BreadcrumbList`.
- Pages d'aide : FAQ (données `FAQPage`), Garanties & retours, Livraison (zones et tarifs de la base), Contact, Suivi de commande.
- Panier : ajout, suppression, quantités plafonnées au stock, sous-total, code promo. Les prix et le stock sont **revérifiés auprès de la base** à l'ouverture du panier et du formulaire de commande (`/api/cart/validate`).
- Bouton « Acheter maintenant » sur chaque fiche produit. Un panier latéral et une page panier.
- Commande en 2 étapes : coordonnées, WhatsApp, adresse, ville, région, informations complémentaires, zone de livraison, moyen de paiement, puis un **récapitulatif avant la validation définitive**. Chaque commande reçoit un **numéro unique** (`GL-AAMMJJ-01001`).
- Page de suivi de commande avec frise de statut, relance du paiement, transmission de la commande sur WhatsApp et impression du reçu.

**Espace client** : inscription, connexion, déconnexion, mot de passe oublié, profil, commandes et leur suivi, adresses (dont l'adresse par défaut), favoris synchronisés avec le compte.

**Administration** (`/admin`, accès selon le rôle)
- Tableau de bord : chiffre d'affaires encaissé, nombre de commandes, commandes en attente, nombre de clients, panier moyen, évolution des ventes sur 7, 30 ou 90 jours, produits les plus vendus, alerte de stock faible.
- Produits : création, modification, suppression, photos multiples réordonnables, prix, prix barré, tailles, couleurs, SKU, stock, mise en vedette, nouveauté, visibilité, SEO.
- Commandes : liste filtrable, détail, changement de statut avec notification au client, informations de livraison (livreur, numéro de suivi, date), contact du client sur WhatsApp, encaissement d'un paiement à la livraison, historique et journal des notifications.
- Catégories, collections (dont la collection vedette), codes promo (pourcentage ou montant, minimum, plafond d'utilisations, dates), zones de livraison (tarif, seuil de gratuité, délai), clients et rôles, messages de contact, abonnés newsletter, paramètres de la boutique et visuels de la page d'accueil.

**Aucune donnée commerciale fictive** n'est livrée. La base ne contient que la structure : catégories, zones de livraison *désactivées* et paramètres vides. Les sections « Meilleures ventes » et « Promotions » ne s'affichent que si elles reposent sur des données réelles.

---

## 2. Architecture

```
Navigateur ──► Next.js (Vercel)
               ├─ Pages catalogue (ISR 60 s, clé anonyme, RLS)
               ├─ Espace client / admin (session Supabase via cookies, RLS)
               ├─ /api/orders ───────► place_order() [clé service] : prix, stock, coupon, livraison recalculés côté base
               ├─ /api/payments/*  ──► Wave / Orange Money / Stripe : création de session
               └─ /api/webhooks/* ◄── prestataires : signature vérifiée ► record_payment_result()
                                        └─► notifications WhatsApp / e-mail
Supabase : PostgreSQL + RLS · Auth · Storage (buckets products, site)
```

Principes de sécurité :
- **Les prix ne viennent jamais du navigateur.** La fonction SQL `place_order` relit les prix, verrouille les lignes de stock (`FOR UPDATE`), contrôle les quantités, applique le coupon et les frais de zone, puis crée la commande, ses lignes, le paiement et la livraison dans une seule transaction.
- **Aucun paiement n'est simulé.** Une commande payée en ligne ne passe à « Confirmée / Payé » qu'après un webhook à la signature vérifiée (Wave : HMAC + relecture de la session ; Stripe : `Stripe-Signature` ; Orange Money : jeton secret) et un contrôle du montant (`MONTANT_INCOHERENT` sinon). Un paiement réussi n'est jamais rétrogradé par un webhook ultérieur.
- **RLS sur toutes les tables.** Un client ne lit que ses commandes, adresses, favoris et son panier. Les codes promo ne sont pas lisibles publiquement : ils sont validés par `validate_coupon`.
- **Garde-fous en base.** Personne ne peut modifier son propre rôle. Depuis le back-office, les montants d'une commande sont figés et le statut d'un paiement en ligne est verrouillé. Une commande annulée remet son stock en place et ne peut plus être rouverte.
- La clé `SUPABASE_SERVICE_ROLE_KEY` et toutes les clés des prestataires restent **côté serveur uniquement**. Aucune n'est préfixée `NEXT_PUBLIC_`.
- L'application envoie des en-têtes de sécurité (HSTS, `nosniff`, `X-Frame-Options`, `Referrer-Policy`) et limite le débit des API sensibles.

### Rôles et permissions

| Rôle | Accès |
| --- | --- |
| `customer` | Boutique et espace client |
| `staff` | Commandes, livraisons, clients (lecture), messages |
| `manager` | + produits, stock, catégories, collections, codes promo, statistiques, newsletter |
| `admin` | + zones de livraison, paramètres, attribution des rôles |

---

## 3. Arborescence

```
.
├── supabase/
│   ├── migrations/
│   │   ├── 0001_schema.sql      tables, types, index
│   │   ├── 0002_functions.sql   rôles, place_order, webhooks, stats, best-sellers
│   │   ├── 0003_rls.sql         Row Level Security + buckets Storage
│   │   ├── 0004_guards.sql      garde-fous sur les commandes
│   │   ├── …                    0005 à 0009 : livraison, paiements, RPC publiques, étiquettes
│   │   ├── 0010_high_tech.sql   marque, caractéristiques, catégories high-tech (appliquée)
│   │   └── 0011_bascule_high_tech.sql  masque le catalogue de mode (à la mise en ligne)
│   └── seed.sql                 catégories, zones (inactives), paramètres vides
├── src/
│   ├── middleware.ts            session Supabase + protection /compte et /admin
│   ├── app/
│   │   ├── layout.tsx           polices, SEO global
│   │   ├── (store)/             boutique : accueil, shop, men, women, accessories,
│   │   │                        collections, produit/[slug], panier, commande,
│   │   │                        commande/confirmation/[number], suivi, compte/*,
│   │   │                        favoris, contact, livraison, conditions, confidentialite
│   │   ├── admin/               back-office (dashboard, commandes, produits, catégories,
│   │   │                        collections, coupons, livraison, clients, messages, parametres)
│   │   ├── api/                 orders, payments/retry, webhooks/{wave,stripe,orange-money},
│   │   │                        coupon, search, products, newsletter, contact
│   │   ├── auth/callback/       retour des e-mails Supabase
│   │   ├── sitemap.ts, robots.ts, icon.svg, not-found.tsx
│   ├── components/              brand (logo GL), layout, home, catalog, product,
│   │                            checkout, order, account, admin, ui
│   ├── lib/                     supabase clients, queries, payments/*, notifications,
│   │                            auth, format, types, rate-limit
│   └── store/                   panier, favoris, UI (Zustand)
├── .env.example
└── legacy/                      ancien fichier HTML du dépôt (conservé, non utilisé)
```

---

## 4. Installation locale

Prérequis : Node.js 20 ou plus récent, ainsi qu'un projet Supabase (l'offre gratuite suffit pour démarrer).

```bash
npm install
cp .env.example .env.local      # puis renseigner les variables (section 5)
npm run dev                     # http://localhost:3000
```

Commandes utiles : `npm run build` (build de production), `npm run typecheck`, `npm test` (tests unitaires des calculs de prix, remises et livraison).

### Mise en place de Supabase

1. Créez un projet sur https://supabase.com et choisissez une région proche, par exemple `eu-west`.
2. Ouvrez **SQL Editor** › **New query**, collez **tout** le fichier `supabase/installation_complete.sql`, puis cliquez sur **Run**. Ce fichier regroupe les migrations, `seed.sql` et `config_gounass.sql`.
   Vous pouvez aussi exécuter **dans l'ordre** `supabase/migrations/0001_schema.sql`, `0002_functions.sql`, `0003_rls.sql`, `0004_guards.sql`, `0005_delivery_payments.sql`, puis `0006` à `0010`, puis `supabase/seed.sql` et enfin **`supabase/config_gounass.sql`**. Pour une nouvelle installation directement en high-tech, exécutez aussi `0011_bascule_high_tech.sql`.
   Ce dernier fichier contient la configuration de la boutique : coordonnées, bandeau, lien Wave, zones du Sénégal actives avec livraison offerte dès 10 000 FCFA, et administrateur `msdgounass@gmail.com`.
   Avec la CLI, c'est `supabase link --project-ref <ref>`, puis `supabase db push`, puis l'exécution de `seed.sql`.
3. Dans **Authentication › URL Configuration** :
   - Site URL : `https://votre-domaine.com`
   - Redirect URLs : `https://votre-domaine.com/auth/callback`, `http://localhost:3000/auth/callback`
4. Dans **Authentication › Providers › Email** : laissez la confirmation d'e-mail activée. Il est aussi conseillé de configurer un SMTP personnalisé (Resend, Brevo…) pour l'envoi des e-mails.
5. Créez votre compte depuis `/compte/inscription` avec **msdgounass@gmail.com**. Ce compte devient administrateur automatiquement, grâce à `config_gounass.sql`.
   Pour un autre e-mail, exécutez `update public.profiles set role = 'admin' where email = 'autre@email.com';`
6. Dans `/admin/livraison`, réglez chaque zone. Une zone inactive n'est jamais proposée au client. Trois modes de tarification :
   - **À confirmer** (réglage par défaut) : sous le seuil de gratuité, l'équipe fixe les frais depuis la fiche commande et le client est prévenu sur WhatsApp. Le paiement en ligne n'est proposé qu'ensuite.
   - **Tarif fixe** pour la zone.
   - **Selon la distance** : base + prix au km depuis le point de départ. Le client partage sa position GPS au moment de commander. Le point de départ se règle en haut de la page ; un bouton « Ma position » permet de le capter.
7. Dans `/admin/parametres`, renseignez téléphone, WhatsApp, e-mail, adresse et réseaux sociaux. Vous pouvez aussi remplacer les visuels de la page d'accueil.
8. Ajoutez vos produits dans `/admin/produits`, avec photos, déclinaisons et stock.

---

## 5. Variables d'environnement

Elles sont listées dans `.env.example`. Les clés dont le nom ne commence pas par `NEXT_PUBLIC_` ne sont jamais envoyées au navigateur.

| Variable | Obligatoire | Où l'obtenir |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | oui | Votre domaine, ex. `https://gounassluxury.com` |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | oui | Supabase › Project Settings › API |
| `SUPABASE_SERVICE_ROLE_KEY` | non (requise pour les paiements par API, webhooks et notifications automatiques) | Même page. **Secrète**. Sans elle, la boutique fonctionne : commandes, suivi, paiement à la livraison et par lien Wave. |
| `WAVE_API_KEY`, `WAVE_WEBHOOK_SECRET` | pour Wave | Wave Business Portal › Développeurs |
| `ORANGE_MONEY_CLIENT_ID`, `ORANGE_MONEY_CLIENT_SECRET`, `ORANGE_MONEY_MERCHANT_CODE`, `ORANGE_MONEY_WEBHOOK_TOKEN`, `ORANGE_MONEY_BASE_URL` | pour Orange Money | Contrat marchand Sonatel (developer.orange-sonatel.com) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | pour la carte | dashboard.stripe.com |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TEMPLATE_NAME`, `WHATSAPP_TEMPLATE_LANG`, `WHATSAPP_ADMIN_NUMBER` | pour les notifications WhatsApp | Meta for Developers › WhatsApp |
| `RESEND_API_KEY`, `EMAIL_FROM` | facultatif | resend.com |

Un moyen de paiement dont les clés manquent s'affiche **« Bientôt disponible »** et ne peut pas être sélectionné. Le paiement à la livraison fonctionne sans configuration. L'état de chaque intégration est visible dans `/admin/parametres`.

### Paiements : ce qu'il faut fournir et configurer

**Wave**
1. Ouvrez un compte Wave Business, puis créez une clé API avec l'accès *Checkout*.
2. Déclarez le webhook `https://votre-domaine.com/api/webhooks/wave` pour les événements `checkout.session.completed` et `checkout.session.payment_failed`, puis copiez le *secret de signature* dans `WAVE_WEBHOOK_SECRET`.

**Orange Money (Sonatel)**
1. Ouvrez un compte marchand Orange Money, puis récupérez `client_id`, `client_secret` et le **code marchand**.
2. Générez un jeton long et aléatoire pour `ORANGE_MONEY_WEBHOOK_TOKEN` (par exemple avec `openssl rand -hex 32`). Déclarez ensuite comme URL de notification : `https://votre-domaine.com/api/webhooks/orange-money?token=<ce jeton>`.
3. ⚠️ L'intégration suit la documentation publique *eWallet v4 QR Code* : endpoints `/oauth/v1/token` et `/api/eWallet/v4/qrcode`, notification avec `status`, `amount` et `metadata`. **Avant la mise en production, comparez ces formats à la documentation remise avec votre contrat** (`src/lib/payments/orange-money.ts`, `src/app/api/webhooks/orange-money/route.ts`). Faites un test en sandbox : `ORANGE_MONEY_BASE_URL=https://api.sandbox.orange-sonatel.com`.

**Carte bancaire (Stripe Checkout)**
1. Le XOF est accepté par Stripe comme devise sans décimales. Vérifiez cependant que votre entité légale peut ouvrir un compte Stripe : le Sénégal ne fait pas partie des pays où Stripe ouvre des comptes marchands. Sinon, l'architecture permet d'ajouter un autre prestataire (PayDunya, CinetPay…) dans `src/lib/payments/`.
2. Déclarez le webhook `https://votre-domaine.com/api/webhooks/stripe` pour les événements `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` et `checkout.session.expired`, puis copiez le secret `whsec_…`.

**Wave par lien marchand** (actif dès maintenant) : tant que l'API Wave n'est pas configurée, le client paie via le lien `https://pay.wave.com/m/M_sn_Rb6z4J8BYSDP/c/sn/`, avec le montant pré-rempli et le numéro de commande affiché. La commande reste « En attente » jusqu'à ce qu'un membre de l'équipe vérifie la réception dans l'application Wave Business et saisisse la **référence de transaction** dans la fiche commande. Ce n'est qu'à ce moment qu'elle passe à « Payée ». Le lien est modifiable dans Admin › Paramètres, et un lien Orange Money peut y être ajouté de la même façon.

**Paiement à la livraison** : la commande reste « En attente ». Elle est marquée « Payé » quand l'équipe clique sur *Marquer comme encaissé*, ou automatiquement au passage au statut *Livrée*.

### Notifications WhatsApp

Les notifications partent à chaque création de commande, paiement reçu, changement de statut, expédition et livraison. Elles sont envoyées au client et, pour les nouvelles commandes et paiements, au numéro `WHATSAPP_ADMIN_NUMBER`.
- Meta impose un **modèle approuvé** pour tout message initié par l'entreprise. Créez un modèle de catégorie *Utility*, en français, avec 3 variables : `{{1}}` = nom, `{{2}}` = n° de commande, `{{3}}` = message. Renseignez ensuite son nom dans `WHATSAPP_TEMPLATE_NAME`.
- Sans configuration, les envois sont simplement notés « skipped » dans le journal, et le client dispose toujours du bouton **« Transmettre sur WhatsApp »**, qui ouvre la conversation avec le numéro de la boutique.

---

## 6. Déploiement sur Vercel

1. Poussez le dépôt sur GitHub, puis sur https://vercel.com faites **Add New › Project** et importez le dépôt. Le framework « Next.js » est détecté automatiquement.
2. Dans **Settings › Environment Variables**, ajoutez toutes les variables de la section 5 pour *Production* et, si besoin, *Preview*.
3. Lancez **Deploy**.
4. Pour le domaine personnalisé, allez dans **Settings › Domains** et ajoutez `gounassluxury.com` et `www.gounassluxury.com`. Chez votre registrar, créez :
   - un enregistrement `A` sur `@` pointant vers `76.76.21.21` ;
   - un `CNAME` sur `www` pointant vers `cname.vercel-dns.com`.

   Le certificat HTTPS est automatique. Mettez ensuite à jour `NEXT_PUBLIC_SITE_URL`, les URL de redirection Supabase (section 4, étape 3) et les URL des webhooks chez chaque prestataire.
5. Redéployez après chaque changement de variable d'environnement.

### Liste de contrôle avant ouverture
- [ ] Migrations et seed exécutés, compte administrateur créé
- [ ] Zones de livraison tarifées et activées
- [ ] Coordonnées de la boutique renseignées (WhatsApp notamment)
- [ ] `0011_bascule_high_tech.sql` exécutée après le déploiement
- [ ] Produits publiés avec marque, photos, versions, stock et caractéristiques techniques
- [ ] Clés de paiement de production installées, webhooks déclarés, **une transaction réelle de faible montant testée par moyen de paiement**
- [ ] Modèle WhatsApp approuvé
- [ ] Mentions légales complétées dans `/conditions` (raison sociale, NINEA, RCCM, politique de retour)

---

## 7. Visuels

Le visuel d'accueil est un smartphone 3D générique (sans marque) construit par le code : aucun modèle ni aucune photo à télécharger. Le logo par défaut est un monogramme vectoriel, remplaçable depuis **Admin › Paramètres**. Les photos produits sont stockées dans Supabase Storage et optimisées par `next/image` (AVIF/WebP) ; privilégiez des photos carrées sur fond uni.

## 8. Tests et performance

```bash
npm test                  # calculs de prix, remises, livraison
npm run build && npm run e2e   # Playwright : ordinateur (1440 px) et mobile (Pixel 7)
```

Les tests de bout en bout lisent le catalogue réel mais **ne créent jamais** de commande, de message ni d'inscription. Ils couvrent l'affichage de toutes les pages (statut, titre H1 unique, absence de débordement horizontal et d'erreur console ou réseau), le Hero 3D, `prefers-reduced-motion`, le méga-menu et le menu mobile, la recherche, les filtres et le tri, le panier (ajout, quantités, total, suppression), le formulaire de commande jusqu'à la validation, les favoris, les liens WhatsApp, les redirections et le SEO (robots, sitemap, métadonnées, données structurées).

Mesures Lighthouse 12 (profil mobile, serveur de production local, au moment de la refonte) :

| Page | Performance | Accessibilité | Bonnes pratiques | SEO |
| --- | --- | --- | --- | --- |
| Accueil | 88–95 | 100 | 100 | 100 |
| Catalogue | 90–92 | 100 | 100 | 100 |
| Catégorie | 94 | 100 | 100 | 100 |
| Fiche produit | 97 | 100 | 100 | 100 |
| FAQ | 97 | 100 | 100 | 100 |

Plusieurs passages successifs donnent des écarts de quelques points (fourchettes ci-dessus). Ces chiffres varient aussi selon le réseau et l'hébergement : mesurez-les à nouveau sur le site en ligne. Le navigateur de mesure n'ayant pas de GPU, la scène 3D y est remplacée par sa silhouette statique, comme chez un visiteur sans accélération graphique.
