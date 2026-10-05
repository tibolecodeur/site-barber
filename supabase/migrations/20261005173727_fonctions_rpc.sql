-- =============================================================================
-- Fonctions RPC publiques : le SEUL chemin du public vers les réservations et les lieux.
-- Toutes en security definer (droits du propriétaire), search_path vide (aucune fonction ou
-- table piégée ne peut s'intercaler), noms qualifiés, entrées validées.
-- Erreurs : exceptions P0001 dont le message est une clé stable pour le front :
--   invalid_input · slot_unavailable · too_soon · too_far · limit_reached · too_late
-- (outside_availability et availability_has_bookings ne concernent que les écritures admin.)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Horizon de réservation : p_now + max_advance, calculé en heure de Paris.
-- Sur un timestamptz, « + 28 days » dépend du réglage TimeZone de la session : au passage à
-- l'heure d'hiver, le résultat varierait d'une heure selon le client. En heure locale,
-- « dans 4 semaines » tombe toujours à la même heure d'horloge à Paris.
-- -----------------------------------------------------------------------------
create or replace function private.max_booking_time(p_now timestamptz)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select ((p_now at time zone 'Europe/Paris') + cfg.max_advance) at time zone 'Europe/Paris'
    from private.settings() cfg;
$$;
revoke all on function private.max_booking_time(timestamptz) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Calcul des créneaux libres (interne). `p_now` est injecté pour que les tests à date fixe
-- (ex. changement d'heure) ne se périment pas.
--   · le jour p_day est interprété en Europe/Paris (une journée peut durer 23 h ou 25 h) ;
--   · la grille part du DÉBUT de chaque dispo, au pas de private.settings().slot_step ;
--     generate_series sur timestamptz avance en temps absolu : pas de doublon ni de trou
--     au changement d'heure ;
--   · un créneau doit tenir entièrement dans la dispo (durée de la prestation) ;
--   · exclus : lieux inactifs, < min_notice, > max_advance, chevauchement avec un RDV
--     confirmé (tous lieux confondus).
-- -----------------------------------------------------------------------------
create or replace function private.compute_slots(
  p_service_id uuid,
  p_day date,
  p_now timestamptz
)
returns table (
  starts_at timestamptz,
  ends_at timestamptz,
  location_id uuid,
  location_label text
)
language sql
stable
set search_path = ''
as $$
  with service as (
    select make_interval(mins => s.duration_min) as duration
      from public.services s
     where s.id = p_service_id
       and s.active
  ),
  cfg as (
    select * from private.settings()
  ),
  bounds as (
    select (p_day::timestamp at time zone 'Europe/Paris') as day_start,
           ((p_day + 1)::timestamp at time zone 'Europe/Paris') as day_end
  )
  select g.slot_start,
         g.slot_start + service.duration,
         l.id,
         l.public_label
    from service
   cross join cfg
   cross join bounds
    join public.availabilities a
      on a.starts_at < bounds.day_end
     and a.ends_at > bounds.day_start
    join public.locations l
      on l.id = a.location_id
     and l.active
   cross join lateral generate_series(
           a.starts_at, a.ends_at - service.duration, cfg.slot_step
         ) as g (slot_start)
   where g.slot_start >= bounds.day_start
     and g.slot_start < bounds.day_end
     and g.slot_start >= p_now + cfg.min_notice
     and g.slot_start <= private.max_booking_time(p_now)
     and not exists (
           select 1
             from public.bookings b
            where b.status = 'confirmed'
              and tstzrange(b.starts_at, b.ends_at, '[)')
                  && tstzrange(g.slot_start, g.slot_start + service.duration, '[)')
         )
   order by g.slot_start;
$$;
revoke all on function private.compute_slots(uuid, date, timestamptz)
  from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- get_available_slots : tout ce que l'écran de réservation affiche pour un jour, en UN
-- appel (créneaux + libellé public du lieu). Jamais l'adresse privée.
-- Prestation inconnue ou inactive → liste vide.
-- -----------------------------------------------------------------------------
create or replace function public.get_available_slots(p_service_id uuid, p_day date)
returns table (
  starts_at timestamptz,
  ends_at timestamptz,
  location_label text
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.starts_at, c.ends_at, c.location_label
    from private.compute_slots(p_service_id, p_day, now()) c;
$$;

-- -----------------------------------------------------------------------------
-- create_booking : crée la réservation et renvoie le récap (dont l'adresse privée et le
-- cancel_token, que seul ce client reçoit).
-- Le lieu est déduit de la dispo ; ends_at est calculé par la base. Le client ne fournit ni
-- l'un ni l'autre.
-- -----------------------------------------------------------------------------
create or replace function public.create_booking(
  p_service_id uuid,
  p_starts_at timestamptz,
  p_first_name text,
  p_last_name text,
  p_phone text default null,
  p_email text default null,
  p_website text default null  -- honeypot : champ invisible, rempli seulement par les robots
)
returns table (
  starts_at timestamptz,
  ends_at timestamptz,
  service_name text,
  location_label text,
  private_address text,
  cancel_token uuid
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_cfg record;
  v_first text := btrim(p_first_name);
  v_last text := btrim(p_last_name);
  v_phone text;
  v_email text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  v_service_name text;
  v_location_id uuid;
  v_count integer;
  v_booking public.bookings%rowtype;
begin
  -- 1. Honeypot : un humain ne voit pas ce champ, il reste vide.
  if nullif(btrim(coalesce(p_website, '')), '') is not null then
    raise exception 'invalid_input' using errcode = 'P0001';
  end if;

  -- 2. Normalisation du téléphone, pour qu'un numéro n'ait qu'une seule écriture :
  --    on retire espaces, points, tirets, parenthèses et barres ; 00 devient + ;
  --    +33 6… devient 06… Tout le reste (ex. « +06… », 9 chiffres) est refusé à l'étape 3.
  v_phone := nullif(regexp_replace(coalesce(p_phone, ''), '[[:space:].()/-]', '', 'g'), '');
  v_phone := regexp_replace(v_phone, '^00', '+');
  v_phone := regexp_replace(v_phone, '^\+33([1-9][0-9]{8})$', '0\1');

  -- 3. Validation de toutes les entrées (mêmes règles que les contraintes de la table, mais
  --    avec une erreur lisible par le front).
  if p_service_id is null
     or p_starts_at is null
     or v_first is null or char_length(v_first) not between 1 and 50
     or v_first ~ '[[:cntrl:]<>"=​-‏‪-‮⁦-⁩]'
     or v_last is null or char_length(v_last) not between 1 and 50
     or v_last ~ '[[:cntrl:]<>"=​-‏‪-‮⁦-⁩]'
     or (v_phone is null and v_email is null)
     or (v_phone is not null and (
           v_phone !~ '^(0[1-9][0-9]{8}|\+[1-9][0-9]{7,14})$' or v_phone ~ '^\+33'))
     or (v_email is not null and (
           char_length(v_email) > 254
           or v_email !~ '^[^@[:space:]<>"]+@[^@[:space:]<>"]+\.[^@[:space:]<>"]+$'))
  then
    raise exception 'invalid_input' using errcode = 'P0001';
  end if;

  select s.name into v_service_name
    from public.services s
   where s.id = p_service_id and s.active;
  if not found then
    raise exception 'invalid_input' using errcode = 'P0001';
  end if;

  -- 4. Fenêtre de réservation.
  select * into v_cfg from private.settings();
  if p_starts_at < now() + v_cfg.min_notice then
    raise exception 'too_soon' using errcode = 'P0001';
  end if;
  if p_starts_at > private.max_booking_time(now()) then
    raise exception 'too_far' using errcode = 'P0001';
  end if;

  -- 5. Le créneau doit être exactement l'un de ceux que propose get_available_slots
  --    (dans une dispo, sur la grille, libre). On en déduit le lieu.
  select c.location_id into v_location_id
    from private.compute_slots(
           p_service_id, (p_starts_at at time zone 'Europe/Paris')::date, now()
         ) c
   where c.starts_at = p_starts_at
   limit 1;
  if v_location_id is null then
    raise exception 'slot_unavailable' using errcode = 'P0001';
  end if;

  -- 6. Anti-abus : au plus N RDV futurs par téléphone ou par email.
  --    Les verrous sérialisent les requêtes d'un même contact : deux réservations
  --    simultanées ne peuvent pas compter « 1 » chacune et finir à 3.
  --    Ordre fixe (téléphone puis email) : pas d'interblocage possible.
  if v_phone is not null then
    perform pg_advisory_xact_lock(hashtextextended('booking:phone:' || v_phone, 0));
  end if;
  if v_email is not null then
    perform pg_advisory_xact_lock(hashtextextended('booking:email:' || v_email, 0));
  end if;

  select count(*) into v_count
    from public.bookings b
   where b.status = 'confirmed'
     and b.starts_at > now()
     and ((v_phone is not null and b.phone = v_phone)
          or (v_email is not null and b.email = v_email));
  if v_count >= v_cfg.max_future_bookings then
    raise exception 'limit_reached' using errcode = 'P0001';
  end if;

  -- 7. Insertion. Si quelqu'un a pris le créneau entre-temps (contrainte d'exclusion), ou si
  --    le barber a supprimé la dispo entre-temps (trigger : outside_availability), on traduit
  --    l'erreur en une seule clé pour le front.
  begin
    insert into public.bookings
      (service_id, location_id, starts_at, first_name, last_name, phone, email)
    values
      (p_service_id, v_location_id, p_starts_at, v_first, v_last, v_phone, v_email)
    returning * into v_booking;
  exception
    when exclusion_violation then
      raise exception 'slot_unavailable' using errcode = 'P0001';
    when raise_exception then
      if sqlerrm = 'outside_availability' then
        raise exception 'slot_unavailable' using errcode = 'P0001';
      end if;
      raise;
  end;

  return query
    select v_booking.starts_at,
           v_booking.ends_at,
           v_service_name,
           l.public_label,
           l.private_address,
           v_booking.cancel_token
      from public.locations l
     where l.id = v_booking.location_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- get_booking : récap pour le porteur du lien d'annulation.
-- Mauvais token → aucune ligne (rien ne fuit, pas même « ce token n'existe pas »).
-- L'adresse privée n'est renvoyée que pour un RDV confirmé et pas encore terminé.
-- Ni téléphone ni email (minimisation : le lien peut avoir été transféré).
-- -----------------------------------------------------------------------------
create or replace function public.get_booking(p_token uuid)
returns table (
  status text,
  starts_at timestamptz,
  ends_at timestamptz,
  service_name text,
  location_label text,
  private_address text,
  first_name text,
  can_cancel boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select b.status,
         b.starts_at,
         b.ends_at,
         s.name,
         l.public_label,
         case when b.status = 'confirmed' and b.ends_at > now() then l.private_address end,
         b.first_name,
         (b.status = 'confirmed' and now() <= b.starts_at - cfg.cancel_notice)
    from public.bookings b
    join public.services s on s.id = b.service_id
    join public.locations l on l.id = b.location_id
   cross join private.settings() cfg
   where p_token is not null
     and b.cancel_token = p_token;
$$;

-- -----------------------------------------------------------------------------
-- cancel_booking : annule si le délai le permet.
--   true  → annulé ;
--   false → token inconnu ou RDV déjà annulé (aucune information ne fuit) ;
--   erreur too_late → moins de cancel_notice avant le RDV (ou RDV passé).
-- -----------------------------------------------------------------------------
create or replace function public.cancel_booking(p_token uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings%rowtype;
  v_cfg record;
begin
  if p_token is null then
    return false;
  end if;

  select * into v_booking
    from public.bookings b
   where b.cancel_token = p_token
   for update;

  if not found or v_booking.status <> 'confirmed' then
    return false;
  end if;

  select * into v_cfg from private.settings();
  if now() > v_booking.starts_at - v_cfg.cancel_notice then
    raise exception 'too_late' using errcode = 'P0001';
  end if;

  update public.bookings set status = 'cancelled' where id = v_booking.id;
  return true;
end;
$$;

-- -----------------------------------------------------------------------------
-- Droits d'exécution : uniquement ces quatre fonctions, uniquement pour anon et
-- authenticated. PUBLIC (tout rôle) n'a rien.
-- -----------------------------------------------------------------------------
revoke all on function public.get_available_slots(uuid, date) from public, anon, authenticated;
revoke all on function public.create_booking(uuid, timestamptz, text, text, text, text, text)
  from public, anon, authenticated;
revoke all on function public.get_booking(uuid) from public, anon, authenticated;
revoke all on function public.cancel_booking(uuid) from public, anon, authenticated;

grant execute on function public.get_available_slots(uuid, date) to anon, authenticated;
grant execute on function public.create_booking(uuid, timestamptz, text, text, text, text, text)
  to anon, authenticated;
grant execute on function public.get_booking(uuid) to anon, authenticated;
grant execute on function public.cancel_booking(uuid) to anon, authenticated;
