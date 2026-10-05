-- =============================================================================
-- Socle de sécurité : extensions, droits par défaut, schéma privé, table des admins,
-- règles métier centralisées.
-- =============================================================================

-- btree_gist : exigé par les règles du projet pour les contraintes d'exclusion.
-- (Une contrainte qui ne porte que sur un tstzrange fonctionne avec GiST natif ; l'extension
-- sert dès qu'on mélange un champ scalaire, par exemple `location_id with =`.)
create extension if not exists btree_gist with schema extensions;

-- -----------------------------------------------------------------------------
-- Droits par défaut : RIEN d'implicite pour anon / authenticated.
-- Le projet distant n'expose déjà aucune nouvelle table ; ces lignes garantissent le même
-- comportement en local et pour tout objet créé plus tard par une migration.
-- Chaque table et chaque fonction reçoit ensuite ses GRANT explicitement.
-- -----------------------------------------------------------------------------
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated;
-- Le droit EXECUTE donné à PUBLIC sur les fonctions est un défaut global de PostgreSQL :
-- il ne se retire qu'au niveau global (sans « in schema »).
alter default privileges for role postgres
  revoke execute on functions from public;

-- -----------------------------------------------------------------------------
-- Schéma privé : fonctions internes, jamais exposées par l'API (seuls public et
-- graphql_public le sont). authenticated y a USAGE uniquement pour que les policies
-- admin puissent appeler private.is_admin().
-- -----------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

-- -----------------------------------------------------------------------------
-- Table des administrateurs : un utilisateur Supabase Auth listé ici est admin.
-- Ajout / retrait uniquement depuis le dashboard (SQL), jamais depuis le site.
-- (Créée ici car private.is_admin() en dépend.)
-- -----------------------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
revoke all on table public.admins from anon, authenticated;

-- Vrai si l'utilisateur connecté est admin. security definer : lit public.admins avec les
-- droits du propriétaire (pas de récursion de RLS, pas besoin de droit sur la table).
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins a where a.user_id = (select auth.uid())
  );
$$;
revoke all on function private.is_admin() from public, anon, authenticated;
grant execute on function private.is_admin() to authenticated;

-- -----------------------------------------------------------------------------
-- Règles métier : L'UNIQUE endroit où elles sont définies.
-- Valeurs par défaut À CONFIRMER avec le barber. Pour en changer une : nouvelle migration
-- avec `create or replace function private.settings()`.
-- -----------------------------------------------------------------------------
create or replace function private.settings()
returns table (
  slot_step interval,            -- pas de la grille de créneaux (part du début de chaque dispo)
  min_notice interval,           -- délai minimum entre maintenant et le début du RDV
  max_advance interval,          -- horizon maximum de réservation
  cancel_notice interval,        -- annulation client possible jusqu'à X avant le RDV
  max_future_bookings integer,   -- RDV futurs max par téléphone ou par email
  data_retention interval        -- conservation des données clients après le RDV (purge à coder)
)
language sql
immutable
set search_path = ''
as $$
  select
    interval '60 minutes',
    interval '2 hours',
    interval '28 days',
    interval '2 hours',
    2,
    interval '6 months';
$$;
revoke all on function private.settings() from public, anon, authenticated;
