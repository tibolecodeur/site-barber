-- =============================================================================
-- Données de départ, à lancer À LA MAIN dans le SQL Editor de Supabase (projet distant).
-- Aussi appliqué en local par `supabase db reset` (config.toml, avant seed-dev.sql).
--
-- Relançable sans risque (idempotent) : une ligne n'est ajoutée que si elle n'existe pas
-- déjà (même id, même nom de prestation ou même libellé de lieu). Rien n'est jamais modifié
-- ni supprimé : les vraies adresses saisies ensuite, ou les prestations modifiées depuis
-- l'admin, ne sont pas écrasées par une nouvelle exécution. Attention : une ligne SUPPRIMÉE
-- serait recréée (la masquer plutôt que la supprimer, ou ne plus relancer ce script).
--
-- Le dépôt est public : AUCUNE vraie adresse ici. Les adresses se saisissent dans le SQL
-- Editor, directement sur la base distante.
-- Contraintes respectées (migration …_tables.sql) : textes sans espace au bord ; nom et
-- libellé de 1 à 80 caractères ; durée entre 15 et 240 min, multiple de 5 ; prix affiché en
-- texte (pas de centimes), 40 caractères max ; adresse de 1 à 300 caractères.
-- =============================================================================

begin;

-- Prestations : 70 min, 12 € chacune.
insert into public.services (id, name, duration_min, price_label, active, sort_order)
select v.id, v.name, v.duration_min, v.price_label, true, v.sort_order
from (
  values
    -- NOM À CONFIRMER AVEC ALIX
    ('a11ce000-0000-4000-8000-000000000001'::uuid, 'Coupe', 70, '12 €', 1),
    -- NOM À CONFIRMER AVEC ALIX
    ('a11ce000-0000-4000-8000-000000000002'::uuid, 'Coupe + barbe', 70, '12 €', 2)
) as v (id, name, duration_min, price_label, sort_order)
where not exists (
  select 1 from public.services s where s.id = v.id or s.name = v.name
);

-- Lieux : libellé public visible de tous ; adresse privée À RENSEIGNER à la main dans le
-- SQL Editor (elle est révélée au client qui réserve : à remplir AVANT d'ouvrir les
-- réservations).
insert into public.locations (id, public_label, private_address, active, sort_order)
select v.id, v.public_label, 'À RENSEIGNER', true, v.sort_order
from (
  values
    ('a11ce000-0000-4000-8000-000000000101'::uuid, 'Angers', 1),
    ('a11ce000-0000-4000-8000-000000000102'::uuid, 'Saint-Christophe-du-Bois', 2)
) as v (id, public_label, sort_order)
where not exists (
  select 1 from public.locations l where l.id = v.id or l.public_label = v.public_label
);

commit;
