-- create_booking, appelée comme le ferait le site : par un visiteur anonyme.
begin;
create extension if not exists pgtap with schema extensions;
-- Rend l'EXECUTE des fonctions pgTAP aux rôles de l'API, le temps du test.
do $$
declare f regprocedure;
begin
  for f in
    select p.oid::regprocedure from pg_proc p
      join pg_depend d on d.objid = p.oid and d.classid = 'pg_proc'::regclass
      join pg_extension e on e.oid = d.refobjid and e.extname = 'pgtap'
  loop
    execute format('grant execute on function %s to anon, authenticated', f);
  end loop;
end $$;

select plan(21);

truncate public.bookings, public.availabilities, public.locations, public.services,
         public.gallery_items, public.admins;

insert into public.services (id, name, duration_min, active) values
  ('10000000-0000-4000-8000-000000000001', 'Coupe', 60, true),
  ('10000000-0000-4000-8000-000000000002', 'Prestation masquée', 60, false);
insert into public.locations (id, public_label, private_address) values
  ('20000000-0000-4000-8000-000000000001', 'Lieu un', '1 rue Secrète, 00000 Testville'),
  ('20000000-0000-4000-8000-000000000002', 'Lieu deux', '2 rue Cachée, 00000 Testville');

insert into public.availabilities (location_id, starts_at, ends_at) values
  -- Dans l'heure qui vient : trop proche pour réserver.
  ('20000000-0000-4000-8000-000000000001',
   date_trunc('hour', now()) + interval '1 hour', date_trunc('hour', now()) + interval '2 hours'),
  -- J+2, 10 h – 16 h, lieu un : 6 créneaux de 60 min.
  ('20000000-0000-4000-8000-000000000001',
   ((now() at time zone 'Europe/Paris')::date + 2 + time '10:00') at time zone 'Europe/Paris',
   ((now() at time zone 'Europe/Paris')::date + 2 + time '16:00') at time zone 'Europe/Paris'),
  -- Dans 30 jours : au-delà de l'horizon de 4 semaines.
  ('20000000-0000-4000-8000-000000000002',
   date_trunc('hour', now()) + interval '30 days', date_trunc('hour', now()) + interval '30 days 2 hours');

set local role anon;

-- ---------------------------------------------------------------------------
-- Cas nominal : le récap contient le lieu (déduit de la dispo), l'adresse et le token.
-- ---------------------------------------------------------------------------
select results_eq(
  $$select location_label, private_address, ends_at - starts_at, cancel_token is not null
      from public.create_booking(
        '10000000-0000-4000-8000-000000000001',
        ((now() at time zone 'Europe/Paris')::date + 2 + time '10:00') at time zone 'Europe/Paris',
        '  Léa ', 'Martin', '06 12 34 56 78', null, null)$$,
  $$values ('Lieu un'::text, '1 rue Secrète, 00000 Testville'::text, interval '60 minutes', true)$$,
  'réservation nominale : récap avec lieu, adresse privée, durée et token');

-- ---------------------------------------------------------------------------
-- Refus
-- ---------------------------------------------------------------------------
select throws_ok(
  $$select * from public.create_booking('10000000-0000-4000-8000-000000000001',
      ((now() at time zone 'Europe/Paris')::date + 2 + time '10:00') at time zone 'Europe/Paris',
      'Tom', 'Durand', '0698765432')$$,
  'P0001', 'slot_unavailable', 'créneau déjà réservé refusé');

select throws_ok(
  $$select * from public.create_booking('10000000-0000-4000-8000-000000000001',
      ((now() at time zone 'Europe/Paris')::date + 2 + time '18:00') at time zone 'Europe/Paris',
      'Tom', 'Durand', '0698765432')$$,
  'P0001', 'slot_unavailable', 'réservation hors disponibilité refusée');

select throws_ok(
  $$select * from public.create_booking('10000000-0000-4000-8000-000000000001',
      ((now() at time zone 'Europe/Paris')::date + 2 + time '10:30') at time zone 'Europe/Paris',
      'Tom', 'Durand', '0698765432')$$,
  'P0001', 'slot_unavailable', 'réservation hors de la grille (10 h 30) refusée');

select throws_ok(
  $$select * from public.create_booking('10000000-0000-4000-8000-000000000001',
      date_trunc('hour', now()) + interval '1 hour', 'Tom', 'Durand', '0698765432')$$,
  'P0001', 'too_soon', 'réservation à moins de 2 h refusée');

select throws_ok(
  $$select * from public.create_booking('10000000-0000-4000-8000-000000000001',
      date_trunc('hour', now()) + interval '30 days', 'Tom', 'Durand', '0698765432')$$,
  'P0001', 'too_far', 'réservation à plus de 4 semaines refusée');

select throws_ok(
  $$select * from public.create_booking('10000000-0000-4000-8000-000000000001',
      ((now() at time zone 'Europe/Paris')::date + 2 + time '15:00') at time zone 'Europe/Paris',
      'Robot', 'Spam', '0611111111', null, 'https://spam.example')$$,
  'P0001', 'invalid_input', 'honeypot rempli : refusé');

select throws_ok(
  $$select * from public.create_booking('10000000-0000-4000-8000-000000000001',
      ((now() at time zone 'Europe/Paris')::date + 2 + time '15:00') at time zone 'Europe/Paris',
      'Tom', 'Durand', null, null)$$,
  'P0001', 'invalid_input', 'ni téléphone ni email : refusé');

select throws_ok(
  $$select * from public.create_booking('10000000-0000-4000-8000-000000000001',
      ((now() at time zone 'Europe/Paris')::date + 2 + time '15:00') at time zone 'Europe/Paris',
      'Tom', 'Durand', null, 'pas-un-email')$$,
  'P0001', 'invalid_input', 'email invalide : refusé');

select throws_ok(
  $$select * from public.create_booking('10000000-0000-4000-8000-000000000001',
      ((now() at time zone 'Europe/Paris')::date + 2 + time '15:00') at time zone 'Europe/Paris',
      '', 'Durand', '0698765432')$$,
  'P0001', 'invalid_input', 'prénom vide : refusé');

select throws_ok(
  $$select * from public.create_booking('10000000-0000-4000-8000-000000000001',
      ((now() at time zone 'Europe/Paris')::date + 2 + time '15:00') at time zone 'Europe/Paris',
      '<img src=x onerror=alert(1)>', 'Durand', '0698765432')$$,
  'P0001', 'invalid_input', 'prénom contenant du HTML : refusé');

select throws_ok(
  $$select * from public.create_booking('10000000-0000-4000-8000-000000000001',
      ((now() at time zone 'Europe/Paris')::date + 2 + time '15:00') at time zone 'Europe/Paris',
      'Tom', 'Durand', '+06 98 76 54 32')$$,
  'P0001', 'invalid_input', 'téléphone mal formé (+06…) : refusé, pas de contournement de la limite');

select throws_ok(
  $$select * from public.create_booking('10000000-0000-4000-8000-000000000002',
      ((now() at time zone 'Europe/Paris')::date + 2 + time '15:00') at time zone 'Europe/Paris',
      'Tom', 'Durand', '0698765432')$$,
  'P0001', 'invalid_input', 'prestation inactive : refusée');

-- ---------------------------------------------------------------------------
-- Anti-abus : 2 RDV futurs max par téléphone (même écrit autrement) ou par email.
-- ---------------------------------------------------------------------------
select lives_ok(
  $$select * from public.create_booking('10000000-0000-4000-8000-000000000001',
      ((now() at time zone 'Europe/Paris')::date + 2 + time '11:00') at time zone 'Europe/Paris',
      'Léa', 'Martin', '+33 6 12 34 56 78')$$,
  '2e RDV futur avec le même téléphone : accepté');
select throws_ok(
  $$select * from public.create_booking('10000000-0000-4000-8000-000000000001',
      ((now() at time zone 'Europe/Paris')::date + 2 + time '12:00') at time zone 'Europe/Paris',
      'Léa', 'Martin', '06.12.34.56.78')$$,
  'P0001', 'limit_reached', '3e RDV futur avec le même téléphone : refusé');

select lives_ok(
  $$select * from public.create_booking('10000000-0000-4000-8000-000000000001',
      ((now() at time zone 'Europe/Paris')::date + 2 + time '13:00') at time zone 'Europe/Paris',
      'Zoé', 'Bernard', null, 'zoe@example.test')$$,
  '1er RDV avec un email : accepté');
select lives_ok(
  $$select * from public.create_booking('10000000-0000-4000-8000-000000000001',
      ((now() at time zone 'Europe/Paris')::date + 2 + time '14:00') at time zone 'Europe/Paris',
      'Zoé', 'Bernard', '0700000001', 'zoe@example.test')$$,
  '2e RDV avec le même email : accepté');
select throws_ok(
  $$select * from public.create_booking('10000000-0000-4000-8000-000000000001',
      ((now() at time zone 'Europe/Paris')::date + 2 + time '15:00') at time zone 'Europe/Paris',
      'Zoé', 'Bernard', '0700000002', '  ZOE@Example.TEST ')$$,
  'P0001', 'limit_reached', '3e RDV futur avec le même email (casse différente) : refusé');

-- ---------------------------------------------------------------------------
-- Vérifications en base (en tant que postgres).
-- ---------------------------------------------------------------------------
reset role;

select is(
  (select phone from public.bookings where first_name = 'Léa' order by starts_at limit 1),
  '0612345678',
  'le téléphone est stocké normalisé');
select is(
  (select first_name from public.bookings order by starts_at limit 1),
  'Léa',
  'le prénom est stocké sans espaces superflus');
select is(
  (select count(*) from public.bookings),
  4::bigint,
  'seules les 4 réservations valides ont été enregistrées');

select * from finish();
rollback;
