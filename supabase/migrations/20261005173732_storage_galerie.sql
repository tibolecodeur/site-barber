-- =============================================================================
-- Storage : bucket « gallery » pour les photos de la galerie.
--   · lecture publique par URL (bucket public : /storage/v1/object/public/gallery/...) ;
--   · AUCUNE policy select pour anon : le contenu du bucket ne peut pas être listé ;
--   · dépôt, remplacement, suppression : admin uniquement ;
--   · 5 Mo max, images jpeg / png / webp uniquement.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gallery', 'gallery', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- L'admin liste et lit les objets (nécessaire aussi pour remplacer un fichier).
drop policy if exists gallery_admin_select on storage.objects;
create policy gallery_admin_select on storage.objects
  for select to authenticated
  using (bucket_id = 'gallery' and (select private.is_admin()));

drop policy if exists gallery_admin_insert on storage.objects;
create policy gallery_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'gallery' and (select private.is_admin()));

drop policy if exists gallery_admin_update on storage.objects;
create policy gallery_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'gallery' and (select private.is_admin()))
  with check (bucket_id = 'gallery' and (select private.is_admin()));

drop policy if exists gallery_admin_delete on storage.objects;
create policy gallery_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'gallery' and (select private.is_admin()));
