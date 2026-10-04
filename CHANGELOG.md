# Journal des modifications

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).
Ce projet suit le [versionnage sémantique](https://semver.org/lang/fr/).

## [Non publié]

### Ajouté

- Socle technique : Vite 8, React 19, TypeScript strict, React Router 8, Tailwind CSS v4.
  shadcn/ui est installable mais volontairement non initialisé : son preset impose une police
  et un thème, décision reportée à la phase 3.
- Outillage de qualité : ESLint (flat config) et Prettier.
- Tests : Vitest + Testing Library avec couverture (seuil 80 % sur `src/features/` et `src/lib/`),
  Playwright en mobile et desktop.
- Arborescence `src/pages`, `src/components`, `src/features`, `src/lib`, et client Supabase unique.
- Sept routes avec des pages vides et un menu de navigation : `/`, `/prestations`, `/galerie`,
  `/reserver`, `/annuler`, `/admin`, et une page 404.
- Intégration continue GitHub Actions : lint, types, couverture, build, end-to-end.
- Modèle de pull request, `vercel.json` pour le routage SPA, ADR 0001 sur le choix de la stack.
- Garde-fou de développement : hook Claude Code interdisant d'éditer des fichiers sur `main`.

### À venir

Base de données et sécurité (phase 2), puis identité visuelle (phase 3).
Voir [`docs/PLAN.md`](docs/PLAN.md).
