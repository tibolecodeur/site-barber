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
- Base de données Supabase (phase 2) :
  - CLI Supabase en devDependency, configuration locale alignée sur le projet distant
    (inscriptions fermées, aucune table exposée par défaut, mot de passe robuste) ;
  - tables `services`, `locations`, `availabilities`, `bookings`, `gallery_items`, `admins` ;
  - aucune double réservation ni dispo qui se chevauche, tous lieux confondus (contraintes
    d'exclusion) ; RDV entièrement dans une dispo du même lieu ; fin du RDV calculée par la base ;
  - RLS sur toutes les tables et droits explicites : le public ne lit que les prestations actives
    et les photos publiées ;
  - fonctions `get_available_slots`, `create_booking`, `get_booking`, `cancel_booking` ;
    l'adresse privée du lieu n'est révélée qu'à la personne qui a réservé ;
  - anti-spam : honeypot, 2 RDV futurs maximum par téléphone ou email ;
  - règles par défaut (à confirmer) centralisées dans `private.settings()` ;
  - bucket Storage `gallery` (lecture publique, écriture admin) ;
  - `seed.sql` avec des adresses factices ;
  - tests pgTAP (accès interdits, chevauchements, délais, tokens, changement d'heure, Storage)
    et job CI dédié ;
  - ADR 0002 (modèle de données, sécurité, confidentialité de l'adresse).
- Documentation des contraintes mobiles, iOS / Android et des navigateurs supportés.

### À venir

Identité visuelle (phase 3).
Voir [`docs/PLAN.md`](docs/PLAN.md).
