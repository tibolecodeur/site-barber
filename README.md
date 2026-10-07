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
| Tests end-to-end                | **Playwright**                       | Parcours réels sur Chromium et WebKit (Safari), mobile et desktop   |
| Tests SQL                       | **pgTAP**                            | Prouver que l'anonyme ne peut pas lire les réservations             |
| Qualité                         | **ESLint** + **Prettier**            | Règles et formatage homogènes                                       |
| Hébergement                     | **Vercel**                           | Déploiement à chaque push, offre gratuite                           |

shadcn/ui n'est pas encore initialisé : son CLI impose de choisir un preset qui embarque une
police, un jeu d'icônes et un thème. Cette décision appartient à la phase 3 (identité visuelle).
Aucune librairie d'animation ou de 3D n'est installée : ce choix est reporté à la phase 7.
Voir [`docs/adr/0001-choix-de-la-stack.md`](docs/adr/0001-choix-de-la-stack.md) pour le détail
des alternatives écartées.

## Installation

Prérequis : **Node.js 22+**, npm, et **Docker** (base Supabase locale).

```bash
git clone <url-du-depot>
cd site-barber
npm ci        # installe exactement package-lock.json (dont la CLI Supabase)

# Variables d'environnement : seule la clé « anon » (publique) va ici.
cp .env.example .env.local
# puis renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
# (Supabase > Project Settings > API)

# Navigateurs pour les tests end-to-end (Chromium = Android et desktop, WebKit = iPhone)
npx playwright install chromium webkit

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
| `npm run test:e2e`      | Tests end-to-end Playwright (Android, iPhone, desktop)           |

Base de données (CLI Supabase installée en devDependency, version figée) :

| Commande                           | Rôle                                                     |
| ---------------------------------- | -------------------------------------------------------- |
| `npx supabase start`               | Lance Supabase en local (Docker), migrations + seed      |
| `npx supabase db start`            | Postgres seul, plus rapide : suffit pour les tests pgTAP |
| `npx supabase db reset`            | Recrée la base locale (migrations puis `seed.sql`)       |
| `npx supabase migration new <nom>` | Nouvelle migration SQL versionnée                        |
| `npx supabase test db`             | Tests pgTAP (dont les accès interdits)                   |
| `npx supabase stop`                | Arrête les conteneurs                                    |

## Base de données

Schéma complet et justification : [`docs/adr/0002-modele-de-donnees-et-securite.md`](docs/adr/0002-modele-de-donnees-et-securite.md).

| Table            | Contenu                                       | Accès public (anon)               |
| ---------------- | --------------------------------------------- | --------------------------------- |
| `services`       | prestations : nom, durée, prix affiché, actif | lecture des prestations actives   |
| `locations`      | lieux : libellé public, **adresse privée**    | aucun                             |
| `availabilities` | plages de disponibilité, chacune dans un lieu | aucun (via `get_available_slots`) |
| `bookings`       | réservations clients                          | aucun (via les RPC ci-dessous)    |
| `gallery_items`  | photos de la galerie                          | lecture des photos publiées       |
| `admins`         | utilisateurs Supabase Auth administrateurs    | aucun                             |

Fonctions RPC publiques (`security definer`, validation complète en SQL) :

| Fonction                                | Rôle                                                            |
| --------------------------------------- | --------------------------------------------------------------- |
| `get_available_slots(service_id, jour)` | créneaux libres d'un jour + libellé public du lieu, en un appel |
| `create_booking(...)`                   | réserve et renvoie le récap (adresse privée, `cancel_token`)    |
| `get_booking(cancel_token)`             | récap pour le porteur du lien d'annulation                      |
| `cancel_booking(cancel_token)`          | annule si le délai le permet                                    |

Erreurs renvoyées au front (message de l'exception) : `invalid_input`, `slot_unavailable`,
`too_soon`, `too_far`, `limit_reached`, `too_late`.

Règles par défaut, **à confirmer avec le barber**, centralisées dans `private.settings()` (une
migration suffit pour les changer) : créneaux de 60 min, réservation au moins 2 h et au plus
4 semaines à l'avance, annulation jusqu'à 2 h avant, 2 RDV futurs max par téléphone ou email,
conservation des données clients 6 mois.

Tests : `supabase/tests/` (pgTAP), un fichier par thème — schéma, anonyme, admin,
chevauchements, `create_booking`, créneaux (dont le changement d'heure), tokens, Storage.
`supabase/seed.sql` ne contient que des données de développement avec des **adresses factices**.

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
supabase/
├── migrations/       toute évolution du schéma, versionnée
├── tests/            tests pgTAP (règles SQL, RLS, accès interdits)
├── seed.sql          données de développement local (adresses factices)
└── config.toml       configuration de la stack locale
docs/                 SPEC, PLAN, DESIGN, ADR, TESTS-APPAREILS (checklist téléphones)
.github/workflows/    CI (lint, types, tests, pgTAP, build, e2e)
```

Deux principes :

- **La logique vit dans `src/features/`**, pas dans les composants. Les pages assemblent, elles ne
  calculent pas. C'est ce qui rend la logique testable sans DOM.
- **Toute modification du schéma passe par une migration** dans `supabase/migrations/`. On ne
  modifie jamais une migration déjà appliquée : on en crée une nouvelle.

## Sécurité

- RLS activée sur toutes les tables, sans exception, et chaque GRANT écrit explicitement.
- Le public ne lit jamais les réservations ni les lieux : il passe par des fonctions RPC
  `security definer` (`get_available_slots`, `create_booking`, `get_booking`, `cancel_booking`)
  qui valident tout côté SQL.
- L'adresse privée du lieu n'est révélée qu'à la personne qui a réservé (et à l'admin).
- Annulation par `cancel_token` (uuid aléatoire), jamais par l'identifiant de la réservation.
- Un créneau ne peut pas être réservé deux fois, tous lieux confondus : contrainte d'exclusion
  PostgreSQL, et non une vérification côté navigateur.
- Anti-spam : champ honeypot et 2 RDV futurs maximum par téléphone ou email.

## Tests end-to-end (Playwright)

Chaque test de `e2e/` tourne sur trois projets (`playwright.config.ts`) :

| Projet           | Moteur   | Simule                                        | Écran      |
| ---------------- | -------- | --------------------------------------------- | ---------- |
| `mobile-android` | Chromium | Chrome Android (profil Pixel 5)               | 375 × 812  |
| `mobile-iphone`  | WebKit   | Safari iOS (profil iPhone 17, user agent iOS) | 375 × 812  |
| `desktop`        | Chromium | Chrome sur ordinateur                         | 1280 × 800 |

```bash
npm run test:e2e                              # les trois projets
npx playwright test --project=mobile-iphone   # un seul projet
```

**Ce que WebKit couvre** : le moteur de rendu et le moteur JavaScript de Safari (CSS, `Date`,
formulaires, comportements propres à WebKit), l'écran tactile et la taille d'un iPhone.
**Ce qu'il ne couvre pas** : ce n'est pas Safari iOS mais WebKit compilé pour Windows / Linux.
Pas de vrai clavier virtuel, pas d'encoche ni de zones sûres, pas de barre d'adresse qui se
replie, pas de réseau mobile, pas d'économie d'énergie. Il **ne remplace pas un vrai iPhone** :
la checklist [`docs/TESTS-APPAREILS.md`](docs/TESTS-APPAREILS.md) se refait à la main sur un
vrai iPhone et un vrai Android avant chaque mise en ligne.

## Navigateurs supportés

Environ 90 % des visiteurs (clients et barber) seront sur téléphone.

- **Safari iOS 16.4+** et **Chrome Android récent** : c'est la limite basse imposée par
  Tailwind CSS v4 (propriétés CSS modernes comme `@property` et `color-mix()`).
- Desktop (Chrome, Firefox, Safari, Edge récents) : supporté, en adaptation secondaire.

## Captures

_À ajouter quand l'identité visuelle sera en place (phase 3)._

## Licence

Projet personnel, tous droits réservés.
