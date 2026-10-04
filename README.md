# Site barber — réservation en ligne

Site vitrine et réservation de créneaux pour un barber étudiant. Les clients réservent **sans
créer de compte** ; le barber publie ses disponibilités et ses créations depuis un espace admin
pensé pour le téléphone. Paiement **sur place, en liquide** : aucun paiement en ligne.

> Projet en cours. Avancement détaillé dans [`docs/PLAN.md`](docs/PLAN.md),
> cahier des charges dans [`docs/SPEC.md`](docs/SPEC.md).

## Fonctionnalités

| Côté client                               | Côté barber (admin)                   |
| ----------------------------------------- | ------------------------------------- |
| Voir les prestations et les tarifs        | Publier ses plages de disponibilité   |
| Parcourir la galerie des créations        | Consulter et annuler les rendez-vous  |
| Réserver un créneau en moins d'une minute | Gérer la galerie depuis son téléphone |
| Annuler via un lien personnel             | Activer / désactiver des prestations  |

## Stack

| Besoin                          | Outil                                | Pourquoi                                                            |
| ------------------------------- | ------------------------------------ | ------------------------------------------------------------------- |
| Build et serveur de dev         | **Vite 8**                           | Démarrage instantané, build optimisé                                |
| Interface                       | **React 19** + **TypeScript** strict | Composants réutilisables, erreurs attrapées à la compilation        |
| Routage                         | **React Router 8**                   | Navigation sans rechargement de page                                |
| Styles                          | **Tailwind CSS v4** (plugin Vite)    | Styles au plus près du markup, zéro CSS mort                        |
| Composants                      | **shadcn/ui**                        | Code copié dans le projet, donc modifiable                          |
| Base de données, auth, fichiers | **Supabase** (PostgreSQL)            | Contrainte d'exclusion anti-double-réservation, RLS, offre gratuite |
| Validation                      | **Zod** + **react-hook-form**        | Un seul schéma pour le formulaire et les données                    |
| Dates                           | **date-fns** (locale `fr`)           | Manipulation de dates sans fuseau implicite                         |
| Tests unitaires                 | **Vitest** + **Testing Library**     | Même moteur que Vite, tests de composants                           |
| Tests end-to-end                | **Playwright**                       | Parcours réels, mobile et desktop                                   |
| Tests SQL                       | **pgTAP**                            | Prouver que l'anonyme ne peut pas lire les réservations             |
| Qualité                         | **ESLint** + **Prettier**            | Règles et formatage homogènes                                       |
| Hébergement                     | **Vercel**                           | Déploiement à chaque push, offre gratuite                           |

Aucune librairie d'animation ou de 3D n'est installée : ce choix est reporté à la phase 7.
Voir [`docs/adr/0001-choix-de-la-stack.md`](docs/adr/0001-choix-de-la-stack.md) pour le détail
des alternatives écartées.

## Installation

Prérequis : **Node.js 22+** et npm.

```bash
git clone <url-du-depot>
cd site-barber
npm install

# Variables d'environnement : seule la clé « anon » (publique) va ici.
cp .env.example .env.local
# puis renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
# (Supabase > Project Settings > API)

# Navigateur pour les tests end-to-end
npx playwright install chromium

npm run dev   # http://localhost:5173
```

> ⚠️ La clé `service_role` de Supabase ne doit **jamais** apparaître dans `src/` ni dans un commit :
> elle contourne toutes les règles de sécurité.

## Scripts

| Commande                | Rôle                                                             |
| ----------------------- | ---------------------------------------------------------------- |
| `npm run dev`           | Serveur de développement sur http://localhost:5173               |
| `npm run build`         | Vérifie les types puis construit `dist/`                         |
| `npm run preview`       | Sert le build de production en local                             |
| `npm run lint`          | ESLint sur tout le projet                                        |
| `npm run typecheck`     | Vérification TypeScript seule                                    |
| `npm run test`          | Tests unitaires et composants (Vitest)                           |
| `npm run test:coverage` | Idem + couverture (seuil 80 % sur `src/features/` et `src/lib/`) |
| `npm run test:e2e`      | Tests end-to-end Playwright (mobile puis desktop)                |

Base de données :

| Commande                           | Rôle                                   |
| ---------------------------------- | -------------------------------------- |
| `npx supabase migration new <nom>` | Nouvelle migration SQL versionnée      |
| `npx supabase test db`             | Tests pgTAP (dont les accès interdits) |

## Architecture

```
src/
├── pages/            une page par route (Accueil, Prestations, Galerie…)
├── components/       composants réutilisables
│   └── ui/           composants shadcn/ui (code copié, modifiable)
├── features/         logique métier, par fonctionnalité
│   ├── booking/      créneaux, réservation, annulation
│   ├── admin/        disponibilités, rendez-vous, galerie
│   └── gallery/      affichage public des créations
├── lib/
│   ├── supabase.ts   client Supabase unique
│   └── schemas.ts    schémas Zod partagés
└── test/setup.ts     configuration des tests

e2e/                  tests Playwright
supabase/migrations/  toute évolution du schéma, versionnée
docs/                 SPEC, PLAN, DESIGN, ADR
.github/workflows/    CI (lint, types, tests, build, e2e)
```

Deux principes :

- **La logique vit dans `src/features/`**, pas dans les composants. Les pages assemblent, elles ne
  calculent pas. C'est ce qui rend la logique testable sans DOM.
- **Toute modification du schéma passe par une migration** dans `supabase/migrations/`. On ne
  modifie jamais une migration déjà appliquée : on en crée une nouvelle.

## Sécurité

- RLS activée sur toutes les tables, sans exception.
- Le public ne lit jamais la table des réservations : il passe par des fonctions RPC
  `security definer` (`get_available_slots`, `create_booking`, `cancel_booking`) qui valident tout
  côté SQL.
- Annulation par `cancel_token` (uuid aléatoire), jamais par l'identifiant de la réservation.
- Un créneau ne peut pas être réservé deux fois : contrainte d'exclusion PostgreSQL, et non une
  vérification côté navigateur.

## Captures

_À ajouter quand l'identité visuelle sera en place (phase 3)._

## Licence

Projet personnel, tous droits réservés.
