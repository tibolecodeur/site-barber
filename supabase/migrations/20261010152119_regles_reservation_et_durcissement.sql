-- =============================================================================
-- Règles de réservation confirmées par le barber, et durcissement (revue PR #13).
--   1. private.settings() : créneaux de 70 min, réservation au plus tard 48 h avant,
--      annulation jusqu'à 24 h avant. Horizon (4 semaines) et limite (2 RDV) inchangés.
--   2. Un lieu actif ne peut pas garder une adresse provisoire.
--   3. anon ne lit sur services que les colonnes utiles à l'affichage.
-- Les fonctions RPC ne changent pas : elles lisent toutes leurs valeurs dans
-- private.settings() (compute_slots, create_booking, get_booking, cancel_booking).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Règles métier. Même signature qu'avant (create or replace garde les dépendances).
--    Délais en HEURES et non en jours : sur un timestamptz, « + 2 days » dépend du fuseau
--    de la session et vaut 47 h ou 49 h au changement d'heure ; « + 48 hours » est absolu.
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
stable
set search_path = ''
as $$
  select
    interval '70 minutes',
    interval '48 hours',
    interval '28 days',
    interval '24 hours',
    2,
    interval '6 months';
$$;
revoke all on function private.settings() from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2. Lieux : l'adresse privée est révélée au client qui réserve. Un lieu actif (qui propose
--    des créneaux) doit donc avoir une vraie adresse, pas une valeur provisoire du seed.
--    On ne compare que les LETTRES, en minuscules : espaces (y compris insécables,
--    tabulations, retours à la ligne), ponctuation, chiffres et accents écrits en deux
--    caractères (lettre + accent combinant) ne permettent pas de contourner la règle ; les
--    variantes sans accent sont refusées aussi.
--    Collation ICU explicite : lower() et [:alpha:] traitent « À » de la même façon quelle
--    que soit la collation par défaut de la base (avec la locale C, lower('À') resterait 'À').
--    Sans NOT VALID : toutes les lignes existantes sont vérifiées ici, et la migration
--    entière échoue si l'une ne respecte pas la règle (rien n'est appliqué).
-- -----------------------------------------------------------------------------
alter table public.locations
  drop constraint if exists locations_address_required_when_active;
alter table public.locations
  add constraint locations_address_required_when_active
  check (
    not active
    or lower(regexp_replace(private_address collate "und-x-icu", '[^[:alpha:]]', '', 'g'))
       not in ('àrenseigner', 'arenseigner', 'adresseréelle', 'adressereelle')
  );

-- -----------------------------------------------------------------------------
-- 3. services : droit de lecture par COLONNE pour anon. Ni created_at ni active (colonnes
--    internes). La policy services_public_read (using (active)) filtre toujours les lignes :
--    une policy ne demande pas de droit sur les colonnes qu'elle lit. Les fonctions RPC,
--    security definer, lisent avec les droits du propriétaire et ne sont pas concernées.
--    authenticated garde la lecture complète (l'admin gère toutes les colonnes).
-- -----------------------------------------------------------------------------
revoke select on table public.services from anon;
grant select (id, name, duration_min, price_label, sort_order) on table public.services to anon;
