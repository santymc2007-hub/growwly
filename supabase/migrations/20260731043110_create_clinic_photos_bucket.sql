-- Bucket público de Storage para las fotos de las clínicas.
insert into storage.buckets (id, name, public)
values ('clinic-photos', 'clinic-photos', true)
on conflict (id) do nothing;

-- Lectura pública: es un directorio abierto, cualquiera puede ver las fotos.
drop policy if exists "Public read access to clinic photos" on storage.objects;
create policy "Public read access to clinic photos"
on storage.objects
for select
to public
using (bucket_id = 'clinic-photos');

-- Solo usuarios autenticados (el panel de administración) pueden
-- subir, reemplazar o borrar fotos.
drop policy if exists "Authenticated users can upload clinic photos" on storage.objects;
create policy "Authenticated users can upload clinic photos"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'clinic-photos');

drop policy if exists "Authenticated users can update clinic photos" on storage.objects;
create policy "Authenticated users can update clinic photos"
on storage.objects
for update
to authenticated
using (bucket_id = 'clinic-photos');

drop policy if exists "Authenticated users can delete clinic photos" on storage.objects;
create policy "Authenticated users can delete clinic photos"
on storage.objects
for delete
to authenticated
using (bucket_id = 'clinic-photos');
