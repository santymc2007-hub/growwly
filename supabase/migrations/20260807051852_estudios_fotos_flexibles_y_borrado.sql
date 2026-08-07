-- Las 5 fotos guiadas pasan a ser opcionales (con al menos 1 obligatoria,
-- validado en la aplicación) y se permite subir fotos adicionales sin
-- ángulo concreto para afinar el análisis. También guardamos el detalle
-- del error si el análisis falla, para poder diagnosticarlo sin bucear
-- en los logs de Vercel.
alter table public.estudios_capilares
  add column if not exists fotos_adicionales text[] not null default '{}'::text[],
  add column if not exists error_detalle text;

comment on column public.estudios_capilares.fotos_adicionales is 'Fotos extra sin ángulo concreto, para afinar el análisis';
comment on column public.estudios_capilares.error_detalle is 'Detalle técnico si el análisis falla (estado = error)';

-- Faltaba también el permiso de borrar (mismo motivo que el de UPDATE
-- que arreglamos antes: sin política explícita, se deniega en silencio).
drop policy if exists "Los pacientes borran sus propios estudios" on public.estudios_capilares;
create policy "Los pacientes borran sus propios estudios"
on public.estudios_capilares
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Los pacientes borran sus propias fotos de estudio" on storage.objects;
create policy "Los pacientes borran sus propias fotos de estudio"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'estudios-capilares'
  and (storage.foldername(name))[1] = auth.uid()::text
);
