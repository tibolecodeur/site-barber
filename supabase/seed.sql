-- =============================================================================
-- Prestations de départ, à lancer À LA MAIN dans le SQL Editor de Supabase (projet distant).
-- Aussi appliqué en local par `supabase db reset` (config.toml, avant seed-dev.sql).
--
-- Relançable sans risque (idempotent) : une prestation n'est ajoutée que si ni son id, ni son
-- nom n'existent déjà. Une prestation renommée ensuite depuis l'admin garde son id : elle
-- n'est pas recréée. Rien n'est jamais modifié ni supprimé par ce script. Attention : une
-- prestation SUPPRIMÉE depuis l'admin serait recréée par une nouvelle exécution (la masquer
-- plutôt que la supprimer, ou ne plus relancer ce script une fois le catalogue en place).
--
-- Le dépôt est public : aucune donnée personnelle ni adresse ici.
-- Contraintes de la table (migration …_tables.sql) respectées : nom sans espace au bord et
-- de 1 à 80 caractères, durée entre 15 et 240 min et multiple de 5, prix de 40 caractères max.
-- =============================================================================

begin;

insert into public.services (id, name, duration_min, price_label, active, sort_order)
select v.id, v.name, v.duration_min, v.price_label, true, v.sort_order
from (
  values
    -- À CONFIRMER AVEC ALIX : nom affiché et prix (durée 60 min validée dans docs/SPEC.md).
    ('a11ce000-0000-4000-8000-000000000001'::uuid, 'Coupe', 60, 'À confirmer', 1),
    -- À CONFIRMER AVEC ALIX : nom affiché et prix (durée 60 min validée dans docs/SPEC.md).
    ('a11ce000-0000-4000-8000-000000000002'::uuid, 'Coupe + barbe', 60, 'À confirmer', 2)
) as v (id, name, duration_min, price_label, sort_order)
where not exists (
  select 1 from public.services s where s.id = v.id or s.name = v.name
);

commit;
