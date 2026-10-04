---
name: nouvelle-migration
description: Créer ou modifier le schéma Supabase (tables, contraintes, RLS, fonctions RPC, storage) de façon sûre et versionnée. À utiliser pour tout changement de base de données.
argument-hint: <changement à apporter au schéma>
allowed-tools: Bash(npx supabase migration new *) Read Grep Glob
---

Changement demandé : $ARGUMENTS

## Migrations existantes
!`ls supabase/migrations 2>/dev/null || echo "(aucune migration pour l'instant)"`

## Règles
- Une migration = un fichier créé avec `npx supabase migration new <nom_en_snake_case>`.
  Ne jamais modifier une migration déjà appliquée : en créer une nouvelle.
- SQL commenté en français, idempotent quand c'est possible (`if not exists`).
- Chaque nouvelle table : `alter table ... enable row level security;` + policies explicites
  (lecture publique seulement si nécessaire, écriture admin via la table `admins`).
- Horodatages en `timestamptz`. Clés primaires `uuid default gen_random_uuid()`.
- Fonctions exposées au public : `security definer`, `set search_path = ''`, noms de tables
  qualifiés (`public.bookings`), validation de TOUTES les entrées, `grant execute ... to anon`
  uniquement pour ces fonctions-là.
- Anti-chevauchement des réservations : extension `btree_gist` + contrainte
  `exclude using gist (tstzrange(starts_at, ends_at) with &&) where (status = 'confirmed')`.

## Étapes
1. Explique le changement et son impact sur la sécurité avant d'écrire.
2. Crée la migration et le SQL.
3. Écris ou mets à jour les tests qui prouvent le comportement (dont les accès interdits).
4. Ne lance pas `supabase db push` toi-même : donne-moi la commande, je l'exécute.
5. Lance l'agent `relecteur-securite` sur la migration.
