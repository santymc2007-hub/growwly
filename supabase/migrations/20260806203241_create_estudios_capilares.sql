-- Estudios capilares: las 5 fotos que sube el paciente + el resultado
-- orientativo que devuelve el análisis con IA. Sirve de "ficha" base
-- para el futuro formulario de solicitud de presupuesto (Fase 3).
create table if not exists public.estudios_capilares (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.profiles (id) on delete cascade,

  foto_frontal          text,
  foto_donante          text,
  foto_coronilla        text,
  foto_perfil_derecho   text,
  foto_perfil_izquierdo text,

  resultado_texto       text,
  norwood_estimado      text,
  es_alopecia_tratable  boolean,

  estado                text not null default 'procesando',

  created_at            timestamptz not null default now()
);

comment on table public.estudios_capilares is 'Estudio orientativo de IA a partir de las 5 fotos guiadas que sube el paciente';
comment on column public.estudios_capilares.resultado_texto is 'Observación orientativa en lenguaje cauto, nunca un diagnóstico';
comment on column public.estudios_capilares.norwood_estimado is 'Ej. "Norwood II-III", o null si no aplica / no es concluyente';
comment on column public.estudios_capilares.es_alopecia_tratable is 'null = no concluyente; true/false según si el patrón encaja con tratamientos del directorio';
comment on column public.estudios_capilares.estado is 'procesando | listo | error';

alter table public.estudios_capilares enable row level security;

drop policy if exists "Los pacientes ven sus propios estudios" on public.estudios_capilares;
create policy "Los pacientes ven sus propios estudios"
on public.estudios_capilares
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Los pacientes crean sus propios estudios" on public.estudios_capilares;
create policy "Los pacientes crean sus propios estudios"
on public.estudios_capilares
for insert
to authenticated
with check (auth.uid() = user_id);

-- Bucket privado para las fotos (a diferencia de las fotos de clínicas,
-- estas son personales y nunca deben ser públicas).
insert into storage.buckets (id, name, public)
values ('estudios-capilares', 'estudios-capilares', false)
on conflict (id) do nothing;

drop policy if exists "Los pacientes suben sus propias fotos de estudio" on storage.objects;
create policy "Los pacientes suben sus propias fotos de estudio"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'estudios-capilares'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Los pacientes ven sus propias fotos de estudio" on storage.objects;
create policy "Los pacientes ven sus propias fotos de estudio"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'estudios-capilares'
  and (storage.foldername(name))[1] = auth.uid()::text
);
