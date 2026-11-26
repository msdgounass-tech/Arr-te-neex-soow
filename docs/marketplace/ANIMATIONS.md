# Système d'animations de la marketplace

Statut : **implémenté** dans `msd-shoppy/` (novembre 2026). Corrections issues de la vérification technique appliquées (section 8).
Toute animation du site passe par ce système. Aucune page ne définit ses propres courbes, durées ou keyframes.
Les valeurs viennent des skills `animate` / `review-animations` (`.claude/skills/`) et ne doivent pas être réinventées.

## 1. Règles communes (non négociables)

1. **Une animation doit avoir une raison** : retour d'action, continuité spatiale, changement d'état, éviter un saut brutal.
   « C'est joli » ne suffit pas sur un élément vu souvent. Le plaisir visuel est réservé aux moments rares (première boutique créée, commande envoyée).
2. **Fréquence** : action répétée des dizaines de fois par jour → quasi imperceptible ou rien. Raccourci clavier → jamais d'animation.
3. **Propriétés** : `transform` et `opacity` uniquement (`clip-path` toléré, hauteur mesurée seulement pour l'accordéon).
   Jamais `width`, `height`, `top`, `left`, `margin`, `padding`, jamais `transition: all`.
4. **Courbes** : entrée/sortie → `--ease-out` ; déplacement à l'écran → `--ease-in-out` ; tiroirs → `--ease-drawer` ;
   survol/couleur → `ease` ; progression continue → `linear`. **Jamais `ease-in`.**
5. **Durées** : interface < 300 ms. Seules exceptions : fenêtres modales, tiroirs/feuilles et notifications.
6. **Jamais `scale(0)`** : on part de `scale(0.95–0.97)` + `opacity: 0`. Menus et infobulles s'ouvrent depuis leur déclencheur.
7. **Interruptible** : transitions CSS ou ressorts (jamais de keyframes) pour ce qui peut être déclenché deux fois de suite (favori, notification, interrupteur).
8. **Accessibilité livrée avec l'animation** : `prefers-reduced-motion` → mêmes durées, opacité seule, plus de déplacement.
   Effets de survol limités à `@media (hover: hover) and (pointer: fine)` (le tactile déclenche de faux survols).
9. **Cascade** : 30 à 80 ms entre éléments, une seule entrée par conteneur, jamais bloquante pour l'utilisateur.
10. **Sobriété** (skill `frontend-design`) : pas d'apparition au défilement sur chaque section ni d'effet sur chaque carte.
    Un seul moment orchestré par page au maximum. Pas de 3D, pas de parallaxe, pas de flou sur de grandes surfaces.

## 2. Outils : une seule bibliothèque

| Besoin | Outil |
| --- | --- |
| Survol, appui, couleur, état piloté par une classe ou un attribut | **CSS transition** |
| Entrée au montage sans état JS | **CSS `@starting-style`** |
| Mouvement prédéfini qui doit rester fluide pendant le chargement | **CSS animation** |
| Animations de sortie, ressorts, glisser-déposer, mises en page | **Motion** (`motion`, import `motion/react`) |

- Bibliothèque unique : **`motion` ≥ 14.2** (accélération matérielle de `x`/`y`/`scale`). Version exacte figée au démarrage du code.
  Pas de GSAP, Lottie, react-spring, Vaul, Sonner, AutoAnimate ni `tailwindcss-animate`.
- Chargement : `LazyMotion` avec les fonctions **complètes** (`domMax`, nécessaires au glisser) importées **à la demande** par `LazyMotionScope`,
  placé autour de chaque composant qui utilise Motion (Sheet, DemoPlayer). Le fournisseur racine ne contient que `MotionConfig reducedMotion="user"`.
- Pages transitions : pas d'API View Transitions (encore expérimentale dans Next.js). Entrée CSS via `template.tsx`.

## 3. Jetons (source unique)

```css
/* src/styles/motion.css */
--ease-out:     cubic-bezier(0.23, 1, 0.32, 1);
--ease-in-out:  cubic-bezier(0.77, 0, 0.175, 1);
--ease-drawer:  cubic-bezier(0.32, 0.72, 0, 1);

--dur-press:    160ms;  /* appui bouton / carte */
--dur-fast:     150ms;  /* survol, couleur, infobulle */
--dur-base:     200ms;  /* menu déroulant, popover, entrée de page */
--dur-reveal:   300ms;  /* apparition au défilement (accueil uniquement) */
--dur-modal:    300ms;  /* fenêtre modale */
--dur-sheet:    400ms;  /* feuille du bas / tiroir */
--dur-toast:    400ms;  /* notification (courbe `ease`, style Sonner) */
--stagger:      50ms;
```

`src/lib/motion/tokens.ts` reprend exactement les mêmes valeurs pour Motion (en secondes).
Un test unitaire compare les deux fichiers pour qu'ils ne divergent jamais.

## 4. Catalogue : quoi utiliser, où

| Situation | Composant / classe | Recette |
| --- | --- | --- |
| **Changement de page** | `app/**/template.tsx` → classe `.page-enter` | opacité 0→1 + `translateY(4px)`→0, `--dur-base`, `--ease-out`. Onglets de la barre du bas (très fréquents) : opacité seule. |
| **Apparition au défilement** | `<Reveal index>` | `IntersectionObserver` partagé, **seuil 15 % de l'élément** (pas de marge négative : un élément en bas de page doit pouvoir apparaître), une seule fois, `translateY(8px)` + opacité, cascade 50 ms via `--i`. **Accueil et pages vitrines seulement**, jamais sur les grilles du catalogue. |
| **Boutons** | classe `.press` | `:active` → `scale(0.97)`, `--dur-press`. Aucune animation de survol hors couleur. |
| **Cartes produit / boutique** | classe `.card-interactive` | Appui `scale(0.98)` ; survol (souris seulement) : ombre via l'opacité d'un pseudo-élément, `--dur-fast`. Pas de soulèvement 3D. |
| **Images produits** | `<FadeImage>` | Opacité 0→1 au chargement, `--dur-base` : évite l'apparition brutale. Dimensions réservées (aucun décalage de mise en page). |
| **Catégories (carrousel)** | défilement natif `scroll-snap` | Aucune animation JS. Puce active : transition de couleur `--dur-fast`. |
| **Favori (cœur)** | `<FavoriteButton>` | Transition `scale(0.85)`→1 + couleur, `--dur-press`, interruptible. Pas de confettis (action fréquente). |
| **Menus, listes déroulantes** | `<Popover>` / `<Menu>` | `scale(0.96)` + opacité, origine = déclencheur, `--dur-base`, sortie plus rapide. |
| **Filtres, panier, menus mobiles** | `<Sheet>` (feuille du bas) | Motion : `translateY(100%)`→0, `--ease-drawer`, `--dur-sheet`, glisser pour fermer (vitesse > 0,11 px/ms), résistance au-delà du bord. Sur ordinateur : tiroir latéral, même composant. |
| **Fenêtre modale** | `<Modal>` | `scale(0.96)` + opacité, centrée, `--dur-modal`. Fond : opacité seule. |
| **Notifications / retours** | `<Toaster>` + `toast()` | Transitions (jamais keyframes), entrée et sortie par le bas, au-dessus de la barre de navigation mobile, `--dur-toast` `ease`. Le texte reprend le verbe de l'action (« Publier » → « Publié »). |
| **Accordéons (FAQ, guides)** | `<Collapse>` | Hauteur mesurée + opacité, `--dur-base`. |
| **Onglets (espace vendeur)** | `<Tabs>` | Indicateur qui glisse (`transform`), `--ease-in-out`, `--dur-base`. |
| **Chargement** | `<Skeleton>` | Pulsation d'opacité `linear`, désactivée en mouvement réduit (gris fixe). |
| **Tableau de bord, statistiques** | `<StatCard>`, graphiques | **Chiffres affichés directement, sans compteur animé** (donnée lue et utilisée). Graphique : fondu de 200 ms au premier affichage seulement, mise à jour sans animation. |
| **Assistant vendeur** | `<GuideStep>` | Passage d'étape : glissement horizontal court, `--ease-in-out`. Mise en évidence de l'élément ciblé : contour orange en fondu, pas de pulsation infinie. |
| **Moments rares** | `<SuccessMark>` | Coche dessinée (`stroke-dashoffset`) + léger ressort (`bounce: 0.2`) : boutique créée, commande envoyée, premier produit publié. Seul endroit où le « plaisir » est permis. |

## 5. Mobile et ordinateur

- Mobile d'abord : toutes les interactions ont un retour **à l'appui** (`:active`), pas au survol.
- Survols activés seulement sur pointeur précis (`hover: hover` + `pointer: fine`).
- Téléphones modestes : `transform`/`opacity` uniquement, pas de `backdrop-filter` sur les grandes surfaces,
  pas de `will-change` permanent, Motion chargé à la demande, `content-visibility: auto` sur les longues grilles.
- `prefers-reduced-motion` géré à deux niveaux : CSS (`@media`) et Motion (`<MotionConfig reducedMotion="user">`).

## 6. Fichiers à créer (étape développement)

```
src/styles/motion.css                 jetons + classes utilitaires (.press, .card-interactive, .page-enter, .reveal…) + réduction des animations
src/lib/motion/tokens.ts              mêmes valeurs pour Motion
src/lib/motion/presets.ts             préréglages Motion : sheet, popover, modal, toast, success
src/lib/motion/useInView.ts           IntersectionObserver partagé (un seul observateur pour toute la page)
src/components/motion/MotionProvider.tsx   LazyMotion + MotionConfig (reducedMotion="user")
src/components/motion/Reveal.tsx      apparition au défilement (+ Stagger)
src/components/motion/FadeImage.tsx   image avec fondu au chargement
src/components/motion/Collapse.tsx    accordéon
src/components/motion/SuccessMark.tsx moment de réussite
src/components/ui/Sheet.tsx           feuille du bas / tiroir avec glisser pour fermer
src/components/ui/Modal.tsx           fenêtre modale
src/components/ui/Popover.tsx         menus, listes déroulantes, infobulles
src/components/ui/Tabs.tsx            onglets avec indicateur
src/components/ui/Skeleton.tsx        chargement
src/components/ui/toast/{store.ts,Toaster.tsx}   notifications
src/app/(site)/template.tsx           transition d'entrée de page
tests/motion-tokens.test.ts           cohérence CSS ↔ TS
```

## 7. Réutilisation sur toutes les pages

- Les pages n'importent **que** ces composants et classes. Elles ne contiennent ni `cubic-bezier`, ni durée en dur, ni `@keyframes`.
- Une modification de jeton dans `motion.css` (et `tokens.ts`) change tout le site d'un coup.
- Contrôle : `grep -rnE "cubic-bezier|transition: all|ease-in[^-]|scale\(0\)" src --include=*.tsx` doit rester vide hors `src/styles/motion.css` et `src/lib/motion/`.
- Revue : lancer `/review-animations` sur chaque lot touchant l'interface avant fusion.

## 8. Corrections issues de la vérification technique (maquette testée dans Chromium)

| Problème constaté | Correction appliquée |
| --- | --- |
| Marge `-10%` : un élément tout en bas de page restait invisible | Seuil `threshold: 0.15`, sans marge |
| `domAnimation` n'inclut pas le glisser : la feuille ne se fermait pas au doigt | `domMax` chargé à la demande (`src/lib/motion/features.ts`) |
| Motion chargé dans le layout racine : ≈ 480 Ko de JS sur chaque page | `LazyMotionScope` par composant : ≈ 173 Ko par page |
| Image déjà en cache avant l'hydratation : pouvait rester à opacité 0 | `FadeImage` vérifie `img.complete` au montage |

## 9. Fichiers réels

`src/styles/motion.css` · `src/lib/motion/{tokens,presets,features}.ts` · `src/components/motion/{MotionProvider,LazyMotionScope,Reveal,FadeImage,SuccessMark}.tsx` ·
`src/components/ui/{Sheet,Toaster,toast}.tsx` · `src/app/(site)/template.tsx` · `tests/unit/motion-tokens.test.ts`.
Les onglets, accordéons (`<details>`) et barres de progression utilisent directement les classes et jetons CSS.
