-- =============================================================================
-- Tables métier, contraintes et triggers d'intégrité.
-- Tout horodatage est en timestamptz (stocké en UTC, affiché en Europe/Paris).
-- Les droits et la RLS sont posés dans la migration suivante (rls_et_droits).
-- =============================================================================

-- Prestations affichées et réservables.
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null check (name = btrim(name) and char_length(name) between 1 and 80),
  duration_min integer not null
    check (duration_min between 15 and 240 and duration_min % 5 = 0),
  price_label text check (price_label is null or char_length(price_label) <= 40),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Lieux où le barber coupe. private_address n'est JAMAIS lisible par le public :
-- elle n'est révélée qu'au porteur d'un cancel_token (create_booking / get_booking).
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  public_label text not null
    check (public_label = btrim(public_label) and char_length(public_label) between 1 and 80),
  private_address text not null check (char_length(btrim(private_address)) between 1 and 300),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Plages de disponibilité publiées par le barber, chacune dans un lieu.
create table if not exists public.availabilities (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations (id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint availabilities_valid_range
    check (ends_at > starts_at and ends_at - starts_at <= interval '24 hours'),
  -- Le barber n'est qu'à un endroit à la fois : deux plages ne se chevauchent jamais,
  -- tous lieux confondus. '[)' : 14h-15h et 15h-16h se touchent sans se chevaucher.
  constraint availabilities_no_overlap
    exclude using gist (tstzrange(starts_at, ends_at, '[)') with &&)
);
create index if not exists availabilities_location_id_idx on public.availabilities (location_id);

-- Réservations. Client sans compte : prénom, nom, téléphone et/ou email, rien d'autre.
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services (id) on delete restrict,
  -- Copie du lieu de la dispo au moment de la réservation : l'historique ne bouge pas.
  location_id uuid not null references public.locations (id) on delete restrict,
  starts_at timestamptz not null,
  -- Toujours recalculé par le trigger bookings_before_write : starts_at + durée.
  ends_at timestamptz not null,
  -- Noms : ni caractères de contrôle, ni balisage (< > " =), ni caractères Unicode invisibles
  -- ou d'inversion de sens (U+200B–U+200F, U+202A–U+202E, U+2066–U+2069). Inoffensifs dans
  -- React, ils deviendraient dangereux dans un email HTML, un export CSV ou un fichier .ics.
  first_name text not null
    check (first_name = btrim(first_name) and char_length(first_name) between 1 and 50
           and first_name !~ '[[:cntrl:]<>"=​-‏‪-‮⁦-⁩]'),
  last_name text not null
    check (last_name = btrim(last_name) and char_length(last_name) between 1 and 50
           and last_name !~ '[[:cntrl:]<>"=​-‏‪-‮⁦-⁩]'),
  -- Téléphone normalisé : français « 0X XX XX XX XX » sans séparateurs, ou international
  -- « +<indicatif><numéro> » (jamais +0…, jamais +33 : converti en 0). Une seule écriture
  -- possible par numéro, ce qui rend fiable la limite anti-abus.
  phone text check (phone ~ '^(0[1-9][0-9]{8}|\+[1-9][0-9]{7,14})$' and phone !~ '^\+33'),
  email text
    check (email = lower(email) and char_length(email) <= 254
           and email ~ '^[^@[:space:]<>"]+@[^@[:space:]<>"]+\.[^@[:space:]<>"]+$'),
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  -- Secret du lien d'annulation : uuid v4 aléatoire (122 bits), jamais l'id.
  cancel_token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now(),
  constraint bookings_contact_required check (phone is not null or email is not null),
  constraint bookings_valid_range check (ends_at > starts_at),
  -- Un créneau n'est JAMAIS réservé deux fois, tous lieux confondus. La base refuse,
  -- même si deux requêtes arrivent à la même milliseconde.
  constraint bookings_no_overlap
    exclude using gist (tstzrange(starts_at, ends_at, '[)') with &&)
    where (status = 'confirmed')
);
create index if not exists bookings_phone_idx on public.bookings (phone)
  where status = 'confirmed';
create index if not exists bookings_email_idx on public.bookings (email)
  where status = 'confirmed';
create index if not exists bookings_service_id_idx on public.bookings (service_id);
create index if not exists bookings_location_id_idx on public.bookings (location_id);

-- Galerie des créations (fichiers dans le bucket Storage « gallery »).
create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  -- Chemin relatif dans le bucket : ni « / » initial, ni « .. ».
  image_path text not null
    check (char_length(image_path) between 1 and 300
           and image_path !~ '^/' and image_path !~ '\.\.'),
  caption text check (caption is null or char_length(caption) <= 200),
  sort_order integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Trigger bookings : calcule ends_at et vérifie que le RDV tient dans une dispo du MÊME
-- lieu. S'applique à toutes les écritures (RPC publique comme écriture admin directe).
-- -----------------------------------------------------------------------------
create or replace function private.bookings_before_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_duration integer;
begin
  -- ends_at n'est jamais fourni par le client : il découle de la durée de la prestation.
  if tg_op = 'INSERT'
     or new.starts_at is distinct from old.starts_at
     or new.service_id is distinct from old.service_id then
    select s.duration_min into v_duration from public.services s where s.id = new.service_id;
    if v_duration is null then
      raise exception 'invalid_input' using errcode = 'P0001';
    end if;
    new.ends_at := new.starts_at + make_interval(mins => v_duration);
  elsif new.ends_at is distinct from old.ends_at then
    -- ends_at ne se modifie jamais à la main.
    new.ends_at := old.ends_at;
  end if;

  -- Un RDV confirmé doit tomber entièrement dans une dispo dont le lieu est celui du RDV.
  -- Vérifié seulement si le créneau, le lieu ou le statut change (corriger le nom d'un
  -- ancien RDV reste possible même si sa dispo a été supprimée depuis).
  if new.status = 'confirmed' and (
       tg_op = 'INSERT'
       or new.starts_at is distinct from old.starts_at
       or new.ends_at is distinct from old.ends_at
       or new.location_id is distinct from old.location_id
       or new.status is distinct from old.status) then
    -- FOR SHARE : une suppression concurrente de la dispo attend la fin de cette transaction.
    perform 1
      from public.availabilities a
     where a.location_id = new.location_id
       and a.starts_at <= new.starts_at
       and a.ends_at >= new.ends_at
       for share;
    if not found then
      raise exception 'outside_availability' using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;
revoke all on function private.bookings_before_write() from public, anon, authenticated;

drop trigger if exists bookings_before_write on public.bookings;
create trigger bookings_before_write
  before insert or update on public.bookings
  for each row execute function private.bookings_before_write();

-- -----------------------------------------------------------------------------
-- Trigger availabilities : interdit de supprimer, raccourcir ou déplacer une dispo qui
-- contient des RDV futurs confirmés. Le barber doit d'abord annuler ces RDV.
-- -----------------------------------------------------------------------------
create or replace function private.availabilities_before_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
      from public.bookings b
     where b.status = 'confirmed'
       and b.ends_at > now()
       and b.location_id = old.location_id
       and b.starts_at >= old.starts_at
       and b.ends_at <= old.ends_at
       and (
         tg_op = 'DELETE'
         or not (b.location_id = new.location_id
                 and b.starts_at >= new.starts_at
                 and b.ends_at <= new.ends_at)
       )
  ) then
    raise exception 'availability_has_bookings' using errcode = 'P0001';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;
revoke all on function private.availabilities_before_change() from public, anon, authenticated;

drop trigger if exists availabilities_before_change on public.availabilities;
create trigger availabilities_before_change
  before update or delete on public.availabilities
  for each row execute function private.availabilities_before_change();
