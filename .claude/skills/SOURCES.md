# Provenance des skills installés

Installés le 2026-11-25 au niveau du projet (`.claude/skills/`), copiés à l'identique depuis leurs dépôts publics.
Contenu : uniquement du Markdown. Aucun script, aucun binaire, aucune dépendance npm, aucun hook, aucun serveur MCP.

| Skill | Source | Version | Licence | Déclenchement |
| --- | --- | --- | --- | --- |
| `frontend-design` | github.com/anthropics/claude-plugins-official — `plugins/frontend-design` (éditeur : Anthropic) | plugin 1.1.1, commit `0fbfda5` | Apache 2.0 (`LICENSE.txt`) | automatique |
| `emil-design-eng` | github.com/emilkowalski/skill — `skills/emil-design-eng` (Emil Kowalski) | commit `64eb3de` (2026-11-15) | MIT (`LICENSE`) | automatique |
| `animate` | github.com/emilkowalski/skill — `skills/animate` | commit `64eb3de` | MIT | automatique |
| `review-animations` | github.com/emilkowalski/skill — `skills/review-animations` | commit `64eb3de` | MIT | **manuel uniquement** (`/review-animations`, `disable-model-invocation: true`) |

## Références vers des skills non installés

Les skills d'Emil Kowalski renvoient parfois à deux skills frères qui ne font pas partie de l'installation demandée :
`../choreograph/SKILL.md` (enchaînement des entrées en cascade) et `../pick-ui-library/SKILL.md` (choix d'une bibliothèque de composants).
Ces liens sont inopérants. Les règles utiles qu'ils couvrent sont reprises dans `docs/marketplace/ANIMATIONS.md`.
Ils peuvent être ajoutés plus tard depuis le même dépôt si besoin.

## Mise à jour

```bash
git clone --depth 1 https://github.com/emilkowalski/skill /tmp/emil
cp -r /tmp/emil/skills/{emil-design-eng,animate,review-animations} .claude/skills/   # puis relire le diff avant de committer
```
