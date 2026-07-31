-- Growwly: tabla principal de clínicas capilares
create extension if not exists "pgcrypto";

create table if not exists public.clinics (
  id                          uuid primary key default gen_random_uuid(),
  slug                        text not null unique,

  -- Datos básicos
  nombre                      text not null,
  descripcion                 text,

  -- Ubicación
  comunidad_autonoma          text,
  provincia                   text,
  ciudad                      text,
  zona                        text,
  lat                         double precision,
  lng                         double precision,

  -- Contacto
  telefono                    text,
  email                       text,
  web                         text,
  redes_sociales              jsonb not null default '{}'::jsonb,

  -- Características / filtros
  tecnicas                    text[] not null default '{}'::text[],
  idiomas                     text[] not null default '{}'::text[],
  financiacion                boolean not null default false,
  primera_consulta_gratis     boolean not null default false,

  -- Media y estado
  fotos                       text[] not null default '{}'::text[],
  verificado                  boolean not null default false,

  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

comment on table public.clinics is 'Directorio de clínicas capilares de Growwly';
comment on column public.clinics.slug is 'Identificador legible usado en /clinicas/[slug]';
comment on column public.clinics.redes_sociales is 'Ej: {"instagram": "...", "facebook": "...", "tiktok": "..."}';
comment on column public.clinics.verificado is 'Sello de verificación editorial de Growwly';

-- Índices para los filtros de /clinicas (ciudad, técnica, idioma)
create index if not exists clinics_ciudad_idx on public.clinics (ciudad);
create index if not exists clinics_tecnicas_idx on public.clinics using gin (tecnicas);
create index if not exists clinics_idiomas_idx on public.clinics using gin (idiomas);

-- Mantener updated_at al día en cada UPDATE
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists clinics_set_updated_at on public.clinics;
create trigger clinics_set_updated_at
before update on public.clinics
for each row
execute function public.set_updated_at();

-- RLS: directorio público de solo lectura.
-- Las escrituras (alta/edición de clínicas) se harán desde el futuro
-- panel de administración usando la service_role key, que salta RLS.
alter table public.clinics enable row level security;

drop policy if exists "Clinics are publicly readable" on public.clinics;
create policy "Clinics are publicly readable"
on public.clinics
for select
to anon, authenticated
using (true);
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
