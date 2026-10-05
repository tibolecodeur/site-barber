-- =============================================================================
-- RLS et droits. Deux verrous successifs :
--   1. GRANT : le rôle a-t-il le droit de toucher la table ? (sinon : 42501 permission denied)
--   2. RLS   : quelles lignes voit-il / peut-il écrire ?
-- Aucun droit n'est implicite (voir socle_securite) : tout est écrit ici.
--
-- Récapitulatif :
--   table            | anon                 | authenticated non-admin | admin
--   services         | SELECT si active     | SELECT si active        | tout
--   gallery_items    | SELECT si published  | SELECT si published     | tout
--   locations        | rien                 | rien                    | tout
--   availabilities   | rien                 | rien                    | tout
--   bookings         | rien                 | rien                    | tout
--   admins           | rien                 | rien                    | SELECT seulement
-- Le public passe par les fonctions RPC (migration fonctions_rpc), jamais par les tables
-- privées.
-- =============================================================================

-- RLS sur TOUTES les tables, sans exception.
alter table public.admins enable row level security;
alter table public.services enable row level security;
alter table public.locations enable row level security;
alter table public.availabilities enable row level security;
alter table public.bookings enable row level security;
alter table public.gallery_items enable row level security;

-- Point de départ : aucun droit pour les rôles de l'API.
revoke all on table
  public.admins, public.services, public.locations,
  public.availabilities, public.bookings, public.gallery_items
from anon, authenticated;

-- -----------------------------------------------------------------------------
-- services : catalogue public (prestations actives), géré par l'admin.
-- -----------------------------------------------------------------------------
grant select on table public.services to anon, authenticated;
grant insert, update, delete on table public.services to authenticated;

drop policy if exists services_public_read on public.services;
create policy services_public_read on public.services
  for select to anon, authenticated
  using (active);

drop policy if exists services_admin_all on public.services;
create policy services_admin_all on public.services
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- -----------------------------------------------------------------------------
-- gallery_items : photos publiées visibles de tous, gérées par l'admin.
-- -----------------------------------------------------------------------------
grant select on table public.gallery_items to anon, authenticated;
grant insert, update, delete on table public.gallery_items to authenticated;

drop policy if exists gallery_items_public_read on public.gallery_items;
create policy gallery_items_public_read on public.gallery_items
  for select to anon, authenticated
  using (published);

drop policy if exists gallery_items_admin_all on public.gallery_items;
create policy gallery_items_admin_all on public.gallery_items
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- -----------------------------------------------------------------------------
-- locations, availabilities, bookings : admin uniquement. anon n'a AUCUN droit.
-- authenticated a les droits de table, mais la RLS ne laisse passer que l'admin
-- (être simplement connecté ne suffit pas).
-- -----------------------------------------------------------------------------
grant select, insert, update, delete on table public.locations to authenticated;
drop policy if exists locations_admin_all on public.locations;
create policy locations_admin_all on public.locations
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

grant select, insert, update, delete on table public.availabilities to authenticated;
drop policy if exists availabilities_admin_all on public.availabilities;
create policy availabilities_admin_all on public.availabilities
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

grant select, insert, update, delete on table public.bookings to authenticated;
drop policy if exists bookings_admin_all on public.bookings;
create policy bookings_admin_all on public.bookings
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- -----------------------------------------------------------------------------
-- admins : l'admin peut lire la liste, personne ne l'écrit via l'API.
-- Ajout / retrait d'un admin : uniquement en SQL depuis le dashboard Supabase.
-- (Un compte admin volé ne peut donc pas se créer un second admin « de secours ».)
-- -----------------------------------------------------------------------------
grant select on table public.admins to authenticated;
drop policy if exists admins_admin_read on public.admins;
create policy admins_admin_read on public.admins
  for select to authenticated
  using ((select private.is_admin()));
