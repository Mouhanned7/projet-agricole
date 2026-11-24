-- Stockage des fichiers (§4, §13.1)
-- Chemins : <land_id>/<fichier>. Photos publiques une fois le terrain publié ;
-- documents fonciers toujours privés (propriétaire + admin).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('land-photos', 'land-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  ('land-documents', 'land-documents', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png', 'image/heic'])
on conflict (id) do nothing;

create policy "photos : lecture" on storage.objects for select using (
  bucket_id = 'land-photos'
  and (public.land_is_public(((storage.foldername(name))[1])::uuid)
       or public.owns_land(((storage.foldername(name))[1])::uuid)
       or public.is_admin())
);
create policy "photos : dépôt" on storage.objects for insert with check (
  bucket_id = 'land-photos' and public.owns_land(((storage.foldername(name))[1])::uuid)
);
create policy "photos : suppression" on storage.objects for delete using (
  bucket_id = 'land-photos' and (public.owns_land(((storage.foldername(name))[1])::uuid) or public.is_admin())
);

create policy "documents : lecture" on storage.objects for select using (
  bucket_id = 'land-documents'
  and (public.owns_land(((storage.foldername(name))[1])::uuid) or public.is_admin())
);
create policy "documents : dépôt" on storage.objects for insert with check (
  bucket_id = 'land-documents' and public.owns_land(((storage.foldername(name))[1])::uuid)
);
