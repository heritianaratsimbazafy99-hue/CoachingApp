# Release readiness

Date de dernière revue : 2026-05-05

## Objectif

Garder le produit stable avant lancement, avec une QA production reproductible
et une dette technique priorisée sans relancer un refactoring large.

## Commande QA production

La passe complète se lance depuis le repo :

```bash
cd /Users/heritiana/Documents/CoachingApp
npm run qa:production
```

Elle vérifie :

- `/` en production ;
- `/content-files/not-a-uuid` en `404` ;
- `/api/cron/calendar-reminders` en `401` sans secret ;
- login admin, coach et coaché ;
- routes principales desktop et mobile ;
- diagnostics admin ;
- téléchargement réel d'un fichier côté coach et coaché ;
- erreurs console, erreurs page, requêtes échouées et overflow horizontal.

Variables optionnelles :

```bash
QA_BASE_URL=https://coaching-app-pi-olive.vercel.app
QA_PASSWORD=Heritiana
QA_ADMIN_EMAIL=admin@ecce.mg
QA_COACH_EMAIL=coach@ecce.mg
QA_COACHEE_EMAIL=coachee@ecce.mg
QA_CONTENT_FILE_ID=47ec5791-dbb0-4e24-aa70-4f5db11fb269
PWCLI=/Users/heritiana/.codex/skills/playwright/scripts/playwright_cli.sh
QA_SKIP_BROWSER=1
QA_KEEP_ARTIFACTS=1
```

`QA_SKIP_BROWSER=1` ne lance que les sondes HTTP. À utiliser uniquement pour
un contrôle rapide, pas pour une validation de sortie.

Par défaut, la commande nettoie les artefacts `.playwright-cli/` après la QA.
`QA_KEEP_ARTIFACTS=1` permet de conserver les téléchargements et snapshots pour
debug.

## Critères de sortie

Avant une livraison ou une grosse démonstration :

```bash
cd /Users/heritiana/Documents/CoachingApp
git status --short
npm run lint
npm run build
npm run qa:production
```

Critères attendus :

- workspace sans changement non prévu ;
- lint sans erreur ;
- build Next.js complet ;
- QA production avec `failedRoutes: []` ;
- diagnostics admin `ok: true` ;
- aucun `globalConsoleErrors`, `pageErrors` ou `requestFailures`.

## Refactoring à éviter avant lancement

À ne pas ouvrir sans bug réel ou besoin produit bloquant :

- refonte auth, rôles ou proxy ;
- refonte RLS ou helpers SQL ;
- restructuration large des services coach/coachee ;
- migration UI globale ;
- changement profond messagerie, parcours, agenda ou notifications.

Ces zones sont fonctionnelles et déjà validées en production. Les toucher
maintenant augmenterait le risque de régression.

## Dette technique priorisée post-lancement

Priorité 1, faible risque :

- mutualiser les états vides, erreurs et loading répétitifs ;
- extraire les petits helpers de formatage de badges, statuts et dates ;
- conserver `npm run qa:production` comme garde-fou avant chaque push majeur.

Priorité 2, risque moyen :

- réduire progressivement la taille de `coach-service` et `coachee-service` par
  domaine fonctionnel ;
- factoriser les composants de listes filtrables ;
- ajouter des tests ciblés autour de `content-files`, diagnostics admin et cron.

Priorité 3, à planifier :

- mini-audit SQL/RLS live après chaque nouvelle policy ;
- monitoring applicatif externe ;
- revue UX avec vrais utilisateurs coach et coaché.

## Règle de décision

Refactorer seulement si l'une de ces conditions est vraie :

- un bug production est identifié ;
- une évolution produit nécessite de toucher la zone ;
- la duplication empêche une livraison courte ;
- la QA production est automatisée et passe avant/après.
