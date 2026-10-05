-- =============================================================================
-- Données de DÉVELOPPEMENT LOCAL uniquement (appliquées par `supabase db reset`).
-- Jamais poussées sur le projet distant.
-- Le dépôt est public : AUCUNE vraie adresse ici. Les vraies adresses se saisissent depuis
-- l'admin (ou le dashboard), directement sur la base distante.
-- =============================================================================

-- Prestations (prix à confirmer avec le barber).
insert into public.services (name, duration_min, price_label, sort_order) values
  ('Coupe', 60, 'À confirmer', 1),
  ('Coupe + barbe', 60, 'À confirmer', 2);

-- Lieux, avec des adresses FACTICES.
insert into public.locations (public_label, private_address, sort_order) values
  ('Chez ses parents', '1 rue de l''Exemple, 00000 Villetest (adresse factice)', 1),
  ('Chez lui', '2 avenue Fictive, 00000 Villetest (adresse factice)', 2);

-- Disponibilités de test : les 7 prochains jours, 14 h–18 h heure de Paris, en alternant
-- les deux lieux. Calculées à partir de la date du jour pour rester toujours « à venir ».
insert into public.availabilities (location_id, starts_at, ends_at)
select
  case when d % 2 = 0 then parents.id else lui.id end,
  (((now() at time zone 'Europe/Paris')::date + d) + time '14:00') at time zone 'Europe/Paris',
  (((now() at time zone 'Europe/Paris')::date + d) + time '18:00') at time zone 'Europe/Paris'
from generate_series(1, 7) as d
cross join (select id from public.locations where public_label = 'Chez ses parents') as parents
cross join (select id from public.locations where public_label = 'Chez lui') as lui;
