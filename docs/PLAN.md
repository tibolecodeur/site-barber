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
      _(CLI installée, `supabase init` fait, MCP en lecture seule ; `supabase login` / `link`
      et `db push` à faire à la main)_
- [x] Tables, contrainte anti-double-réservation (tous lieux), RLS, lieux à adresse privée
- [x] Fonctions RPC : créneaux libres, réserver, consulter, annuler · bucket Storage galerie
- [x] Tests pgTAP (dont accès interdits et changement d'heure) + job CI + revue `relecteur-securite`
- [ ] Règles par défaut confirmées avec le barber (60 min, 2 h, 4 semaines, annulation 2 h,
      2 RDV futurs, conservation 6 mois)

## Phase 3 — Identité visuelle

- [x] `/direction-artistique` : 3 propositions, choix B + C, docs/DESIGN.md + ADR 0003
- [x] Couleurs, typographies, composants de base
      _(tokens, Archivo, Button, Field, Section, Card, hero ; restent : style des champs à
      valider, vidéo et poster du hero, logo HD)_

## Phase 4 — Vitrine

- [x] Squelette des pages : structure HTML, textes provisoires, sans style ni base
      (accueil à sections, /reserver, /annuler, /admin, pages légales, 404), tests e2e et axe
- [ ] Accueil · Prestations · Galerie · Contact · Pages légales
      _(structure en place ; restent le style, les vraies données, les photos, la section
      contact et la rédaction des pages légales)_

## Phase 5 — Réservation client

- [ ] Parcours complet · Confirmation + .ics + lien d'annulation · Page d'annulation
- [ ] Tests Playwright mobile
- [ ] **`<meta name="robots" content="noindex">` sur `/admin`, `/annuler` et la 404**
      (prop à ajouter à `PageMeta`). **À faire avant la mise en ligne de la réservation.**
- [ ] **`referrer: no-referrer` sur `/annuler`** : l'URL contient le `cancel_token`, il ne doit
      pas partir vers un autre site via l'en-tête Referer (balise meta et/ou en-tête HTTP dans
      `vercel.json`). **À faire avant la mise en ligne de la réservation.**
- [ ] Formulaire : `required` (ou équivalent via Zod / react-hook-form) et zones `aria-live`
      pour les créneaux, les erreurs et la confirmation _(reporté depuis le squelette des pages)_
- [ ] Accessibilité : déplacer le focus (h1 ou `main`) après un changement de page, pour que
      les lecteurs d'écran l'annoncent _(reporté depuis le squelette des pages)_

## Phase 6 — Espace admin

- [ ] Connexion · Disponibilités · Liste des RDV · Galerie · Prestations

## Phase 7 — Animations et effets

- [ ] Choix des librairies et des effets (docs/DESIGN.md) · Mise en place

## Phase 8 — Mise en ligne

- [ ] Version 1.0.0 : tag Git, CHANGELOG, README avec captures
- [ ] `/check-deploiement` · Données de test supprimées · Compte admin du barber · Domaine
- [ ] **Purge RGPD codée et planifiée** : suppression des données clients 6 mois après le RDV
      (`private.settings().data_retention`). **Bloquant pour la mise en ligne** (ADR 0002).
- [ ] **Protéger l'adresse privée** : la révéler tard (ex. quelques heures avant le RDV) ou après
      validation de la réservation par le barber. Aujourd'hui `create_booking` la renvoie tout de
      suite : n'importe qui peut l'obtenir en réservant avec un contact inventé puis en annulant
      (risque n° 1 de l'ADR 0002). **Bloquant pour la mise en ligne.**

## V2

- [ ] Emails (Resend, nécessite un domaine) · Admin installable (PWA) · Captcha si spam
