# Plan de réalisation

Les consignes de chaque étape sont données au fur et à mesure (préparées à part, puis collées ici
dans Claude Code). Claude coche les cases quand une étape est terminée et validée.

## Phase 1 — Socle technique

- [ ] Projet Vite + React + TS, Tailwind v4, shadcn/ui, React Router, ESLint + Prettier
      _(fait, sauf shadcn/ui : volontairement reporté à la phase 3, son CLI imposant de choisir
      un preset qui embarque police, icônes et thème)_
- [x] Tests : Vitest + couverture, Playwright (e2e), scripts npm
- [ ] Dépôt GitHub, protection de `main`, issues pour chaque phase, modèle de PR
      _(modèle de PR fait ; le reste est à faire à la main sur GitHub)_
- [x] CI GitHub Actions (lint, typecheck, tests, build, e2e) · README · ADR 0001 (choix de stack)
- [x] Pages vides et navigation (accueil, prestations, galerie, réserver, admin)
- [ ] Déployé sur Vercel

## Phase 2 — Base de données et sécurité

- [ ] Projet Supabase (dev) relié
- [ ] Tables, contrainte anti-double-réservation, RLS
- [ ] Fonctions RPC : créneaux libres, réserver, annuler
- [ ] Tests pgTAP (dont accès interdits) + revue `relecteur-securite`

## Phase 3 — Identité visuelle

- [ ] `/direction-artistique` : 3 propositions, choix, docs/DESIGN.md + ADR
- [ ] Couleurs, typographies, composants de base

## Phase 4 — Vitrine

- [ ] Accueil · Prestations · Galerie · Contact · Pages légales

## Phase 5 — Réservation client

- [ ] Parcours complet · Confirmation + .ics + lien d'annulation · Page d'annulation
- [ ] Tests Playwright mobile

## Phase 6 — Espace admin

- [ ] Connexion · Disponibilités · Liste des RDV · Galerie · Prestations

## Phase 7 — Animations et effets

- [ ] Choix des librairies et des effets (docs/DESIGN.md) · Mise en place

## Phase 8 — Mise en ligne

- [ ] Version 1.0.0 : tag Git, CHANGELOG, README avec captures
- [ ] `/check-deploiement` · Données de test supprimées · Compte admin du barber · Domaine

## V2

- [ ] Emails (Resend, nécessite un domaine) · Admin installable (PWA) · Captcha si spam
