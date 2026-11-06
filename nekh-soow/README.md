# Arrêt nekh soow — boutique en ligne et back-office

Site de commande à emporter pour **Arrêt nekh soow** (Thiès Mbour 3) : Soow Piir, Thiakry, Ngallakh, Lakh, yaourt maison.
Le client choisit ses produits, réserve une heure de retrait et récupère sa commande sans attendre.

Cette version remplace l'ancien fichier unique `legacy/arret-nekh-soow.html`, dont toutes les données restaient dans le
navigateur de chaque visiteur. Les commandes n'arrivaient donc jamais au propriétaire.

| | Ancienne version | Nouvelle version |
| --- | --- | --- |
| Commandes reçues par le propriétaire | ❌ restaient sur le téléphone du client | ✅ base de données centrale + alerte sonore en direct |
| Prix / produits modifiés | ❌ visibles seulement sur l'appareil de l'admin | ✅ mis à jour pour tout le monde |
| Capacité par créneau | ❌ comptée par navigateur | ✅ garantie côté serveur (verrou transactionnel) |
| Numéros de commande | ❌ identiques d'un client à l'autre | ✅ uniques (`NS-AAMMJJ-1234`) |
| Accès admin | ❌ code `4429` lisible dans la page | ✅ compte e-mail + mot de passe, rôle vérifié en base |
| Prix | ❌ calculés dans le navigateur | ✅ recalculés par la base, impossibles à falsifier |
| Téléphone | ❌ « abcdefgh » accepté | ✅ numéro sénégalais validé (70/75/76/77/78/33) |
| Poids de la page | ❌ 1,5 Mo (images intégrées) | ✅ ~40 Ko de code + images WebP chargées à la demande |
| Bouton Retour du téléphone | ❌ quittait le site | ✅ navigation normale |
| Suivi par le client | ❌ aucun | ✅ page de suivi en direct + annulation tant que non confirmée |

## Fonctionnalités

**Boutique** (`index.html`)
- Accueil avec le prochain créneau libre affiché en direct, les favoris, « Comment ça marche », l'histoire et les infos pratiques.
- Carte filtrable par catégorie, choix du format, quantité, stock affiché quand il est bas, produits épuisés grisés.
- Panier latéral, conservé entre les visites et revérifié à chaque ouverture (produit retiré, prix ou stock modifié).
- Commande en une page : jour et heure avec places restantes, coordonnées mémorisables, moyen de paiement (au retrait, Wave, Orange Money).
- Page de suivi en direct : frise de statut, ajout au calendrier (rappel 30 min avant), envoi sur WhatsApp, reçu imprimable, itinéraire, annulation.
- « Mes commandes » sur l'appareil, page Contact, page Confidentialité (loi sénégalaise 2008-12) avec effacement des données locales.
- Référencement : description, aperçu WhatsApp/Facebook (Open Graph), données structurées `FoodEstablishment`, application installable.
- Accessibilité : navigation au clavier, libellés lisibles par les lecteurs d'écran, contrastes, respect de « réduire les animations ».

**Back-office** (`admin.html`)
- **Tableau de bord** : chiffre d'affaires du jour et évolution par rapport à la veille, commandes, à préparer, panier moyen, graphique sur 14 jours, meilleures ventes, statuts du jour, prochains retraits.
- **Commandes en temps réel** : son, notification système et pastille dans l'onglet à chaque nouvelle commande. Classées par créneau avec le remplissage, filtres (aujourd'hui, demain, 7 jours, date, statut), recherche, bouton « étape suivante » en un geste, message WhatsApp pré-rédigé selon le statut, encaissement, note interne, historique, ticket imprimable, export CSV pour Excel.
- **Production** : quantités à préparer par produit, par format et par créneau, ordre de retrait, fiche imprimable.
- **Produits** : création, modification, photo (optimisée automatiquement), formats et prix, stock facultatif, mise en ligne, mise en avant, ordre d'affichage.
- **Créneaux** : heures proposées, capacité par créneau, délai minimum, nombre de jours réservables, fermeture hebdomadaire, calendrier sur 14 jours pour fermer un jour ou un créneau précis.
- **Réglages** : textes de la boutique, contacts, annonce en bandeau, ouverture ou suspension des commandes, mot de passe, lien de partage.

## Essayer tout de suite (mode démonstration)

Sans configuration, le site fonctionne en **mode démonstration** : toutes les règles de la base sont reproduites dans le navigateur, avec un historique fictif de commandes.

```bash
cd nekh-soow
python3 -m http.server 8080
# Boutique : http://localhost:8080/
# Back-office : http://localhost:8080/admin.html  (identifiant demo, mot de passe demo)
```

Ouvrez la boutique et le back-office dans deux onglets : une commande passée d'un côté apparaît instantanément de l'autre, avec le son.

## Mise en production (environ 15 minutes)

### 1. Base de données Supabase
1. Créez un projet sur [supabase.com](https://supabase.com), région `eu-west` (la plus proche du Sénégal), ou réutilisez un projet existant : toutes les tables sont préfixées `ns_`.
2. **SQL Editor** → collez le contenu de [`supabase/schema.sql`](supabase/schema.sql) → **Run**. Le script peut être relancé sans risque.
3. **Authentication → Users → Add user** : créez le compte du propriétaire (e-mail + mot de passe).
4. Dans le SQL Editor, donnez-lui l'accès au back-office :
   ```sql
   insert into public.ns_admins(user_id)
   select id from auth.users where email = 'proprietaire@exemple.com'
   on conflict do nothing;
   ```
5. **Authentication → Sign In / Providers** : désactivez « Allow new users to sign up ». Seuls les comptes que vous créez pourront se connecter.
6. **Authentication → URL Configuration** : mettez l'adresse du site dans *Site URL*. C'est nécessaire pour le lien « mot de passe oublié ».

### 2. Configuration
Dans [`assets/js/config.js`](assets/js/config.js), renseignez :
- `SUPABASE_URL` : *Project Settings → API → Project URL* ;
- `SUPABASE_ANON_KEY` : la clé **publishable** (ou « anon »). Elle est publique par conception et la sécurité repose sur les règles RLS. Ne mettez **jamais** la clé `service_role` ici ;
- `SITE_URL` : l'adresse publique du site, utilisée dans les liens de suivi envoyés sur WhatsApp.

### 3. Hébergement
C'est un site statique, sans étape de compilation.
- **Vercel** : *Add New Project* → ce dépôt → **Root Directory : `nekh-soow`**, Framework : *Other*, sans commande de build. Le fichier `vercel.json` ajoute les en-têtes de sécurité (CSP, HSTS…) et la mise en cache.
- **Hostinger, Netlify ou tout autre hébergeur** : envoyez le contenu du dossier `nekh-soow/`.

### 4. Vérifications avant l'ouverture
- [ ] Passer une commande test depuis un téléphone, puis la voir arriver dans le back-office avec le son.
- [ ] Faire passer la commande par tous les statuts et vérifier la page de suivi côté client.
- [ ] Remplacer les textes, horaires et adresse dans **Réglages**, puis ajuster les créneaux.
- [ ] Ajouter une photo au Yaourt maison (c'est le seul produit qui n'en a pas).
- [ ] Installer le back-office sur le téléphone du propriétaire (Chrome → « Ajouter à l'écran d'accueil »).

## Architecture

```
nekh-soow/
├── index.html            Boutique (application monopage, routage par ancre)
├── admin.html            Back-office
├── assets/css/           base.css (design system) · shop.css · admin.css
├── assets/js/
│   ├── config.js         URL et clé publique Supabase
│   ├── api.js            Accès aux données (Supabase) — même interface que la démo
│   ├── demo.js           Mode démonstration (localStorage + BroadcastChannel)
│   ├── util.js           Dates (fuseau Africa/Dakar), créneaux, téléphone, statuts, formats
│   ├── shop.js           Logique boutique
│   └── admin.js          Logique back-office
├── assets/img/           Photos WebP, logo, icônes, image de partage
└── supabase/schema.sql   Tables, RLS, fonctions, stockage photos, temps réel, catalogue initial
```

**Sécurité côté base**
- `ns_place_order` revérifie tout dans une seule transaction : boutique ouverte, nom, téléphone, jour ouvert, créneau existant et non fermé, délai minimum, **capacité** (verrou par créneau), produits actifs, **prix relus en base**, quantités (1 à 99), stock, anti-abus (4 commandes par heure et par numéro).
- Les visiteurs ne lisent que le catalogue et les réglages. Ils ne voient jamais les commandes des autres : le suivi se fait par un jeton aléatoire impossible à deviner.
- Un garde-fou interdit de modifier le montant d'une commande et de rouvrir une commande annulée ou récupérée. Il historise chaque changement de statut et restitue le stock à l'annulation.
- Le back-office est réservé aux comptes inscrits dans `ns_admins`, qu'on ne peut modifier qu'en SQL.

Le schéma a été testé sur PostgreSQL : commande valide, téléphone invalide, créneau inexistant, jour passé, quantité excessive, insertion directe refusée, modification de prix refusée, créneau complet, anti-abus, stock insuffisant, annulation avec restitution du stock, utilisateur connecté non admin sans aucun accès, montant figé, commande clôturée, ajout d'admin refusé.

## Évolutions possibles
- **Paiement en ligne Wave / Orange Money** avec confirmation automatique : nécessite un compte marchand et une fonction serveur (Supabase Edge Function) pour recevoir les confirmations de paiement.
- **Message WhatsApp automatique** au client quand sa commande passe à « Prête » : nécessite l'API WhatsApp Business (Meta). Aujourd'hui, le message est pré-rédigé et part en un geste depuis le back-office.
- Programme de fidélité (par exemple une commande offerte toutes les dix), codes promo, commandes pour les événements.
