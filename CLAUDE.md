# Instructions pour Claude Code

Ce dépôt contient plusieurs projets :

- **Shoppy by MSD** (marketplace multi-vendeurs, `msd-shoppy/`) : commencer par `docs/marketplace/CONTEXTE.md`, puis `msd-shoppy/README.md` ;
  `docs/marketplace/ANIMATIONS.md` pour toute interface animée (jetons et composants communs obligatoires).
- **GOUNASS LUXURY** (racine : `src/`, `supabase/`) : voir `README.md`. Ne pas modifier dans le cadre de la marketplace.
- **Arrêt nekh soow** (`nekh-soow/`, `legacy/`) : voir `nekh-soow/README.md`. Ne pas modifier dans le cadre de la marketplace.

Règles :
- Réponses et documentation en français.
- Le nom officiel est Shoppy by MSD.
- Ne jamais inventer de statistiques, d'avis, de ventes ou de badges ; ne jamais simuler un paiement.
- Toute règle sensible (prix, stock, statuts, abonnements, confiance) vit en base : ajouter un test dans `msd-shoppy/supabase/tests/business.test.sql`.
- Skills du projet dans `.claude/skills/` (provenance : `SOURCES.md`) ; ne les charger que pour la tâche concernée.
