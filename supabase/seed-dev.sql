-- =============================================================================
-- Données de DÉVELOPPEMENT LOCAL uniquement (appliquées par `supabase db reset`, après
-- seed.sql qui crée les prestations et les lieux). NE JAMAIS lancer ce fichier sur le
-- projet distant.
-- Relançable : rien n'est ajouté en double.
-- =============================================================================

-- Garde : les lieux sont retrouvés par leur libellé public, le même qu'en production. Lancé
-- par erreur sur le distant, ce fichier créerait des dispos sur les VRAIS lieux. Une base qui
-- a déjà un admin ou des RDV n'est pas une base locale neuve : on s'arrête.
do $$
begin
  if exists (select 1 from public.admins) or exists (select 1 from public.bookings) then
    raise exception 'seed-dev.sql : base non vierge (probablement le projet distant). Abandon.';
  end if;
end $$;

-- Disponibilités de test : les 7 prochains jours, 14 h–18 h heure de Paris, en alternant
-- les deux lieux de seed.sql. Calculées à partir de la date du jour pour rester « à venir ».
-- Une plage qui en chevaucherait une existante est sautée (contrainte d'exclusion).
insert into public.availabilities (location_id, starts_at, ends_at)
select slot.location_id, slot.starts_at, slot.ends_at
from (
  select
    case when d % 2 = 0 then angers.id else saint_christophe.id end as location_id,
    (((now() at time zone 'Europe/Paris')::date + d) + time '14:00') at time zone 'Europe/Paris'
      as starts_at,
    (((now() at time zone 'Europe/Paris')::date + d) + time '18:00') at time zone 'Europe/Paris'
      as ends_at
  from generate_series(1, 7) as d
  cross join (select id from public.locations where public_label = 'Angers') as angers
  cross join (
    select id from public.locations where public_label = 'Saint-Christophe-du-Bois'
  ) as saint_christophe
) as slot
where not exists (
  select 1 from public.availabilities a
  where tstzrange(a.starts_at, a.ends_at, '[)') && tstzrange(slot.starts_at, slot.ends_at, '[)')
);
