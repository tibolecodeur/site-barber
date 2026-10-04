---
name: nouvelle-feature
description: Méthode pour développer une fonctionnalité du site de bout en bout (plan, code, tests, revue, commit). À utiliser dès qu'on commence une nouvelle fonctionnalité ou une page.
argument-hint: <description de la fonctionnalité>
---

Fonctionnalité demandée : $ARGUMENTS

## État actuel
!`git status --short`
!`git log --oneline -5`

## Étapes (dans l'ordre, sans en sauter)
0. **Branche** — Crée une branche `feat/<nom-court>` depuis `main` à jour (si ce n'est pas déjà fait).
1. **Comprendre** — Relis la partie concernée de `docs/SPEC.md` et le code existant lié.
   Si un point de la spec est ambigu, pose-moi la question au lieu de deviner.
2. **Plan** — Propose un plan court : fichiers créés/modifiés, composants, données (RPC / tables),
   états (chargement, vide, erreur, succès), cas limites. Attends mon « go ».
3. **Test d'abord** quand c'est de la logique (calcul de créneaux, validation, formatage de dates) :
   écris le test Vitest qui échoue, puis le code. Parcours utilisateur → test Playwright dans `e2e/`.
   Règle SQL → test pgTAP dans `supabase/tests/`.
4. **Code** — Composants petits et typés, logique hors des composants (`src/features/...`),
   Tailwind + composants shadcn, mobile d'abord. Explique-moi les notions React nouvelles au passage.
5. **Vérifier** — `npm run lint`, `npm run typecheck`, `npm run test:coverage`, `npm run build`
   (et `npm run test:e2e` si un parcours est touché) doivent passer. Corrige tant que ce n'est pas vert.
6. **Revue** — Si la fonctionnalité touche aux données ou à l'auth : agent `relecteur-securite`.
   Si elle est visible : agent `directeur-artistique` (et `testeur-ui` pour un parcours).
   Corrige les points 🔴 et 🟠.
7. **Clôture** — Coche l'étape dans `docs/PLAN.md`, mets à jour README / ADR si besoin, commite
   (Conventional Commits), puis propose de pousser et d'ouvrir la PR avec `gh pr create` :
   résumé, captures si visuel, comment tester, `Closes #n`. Je fusionne moi-même après la CI.
