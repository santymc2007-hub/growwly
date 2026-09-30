-- Impresiones de la tarjeta de una clínica en los listados internos
-- (portada, /clinicas, ciudad, ficha de tratamiento) — el paso del
-- embudo anterior a la vista de ficha. Sirve de argumento real para
-- vender espacios de visibilidad extra ("cuánto más te van a ver").
create table if not exists public.clinic_impresiones_listado (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references public.clinics (id) on delete cascade,
  superficie  text not null,
  created_at  timestamptz not null default now()
);

comment on column public.clinic_impresiones_listado.superficie is
  'listado | ciudad | home_destacadas | home_semana | tratamiento';

create index if not exists clinic_impresiones_listado_clinic_id_created_at_idx
  on public.clinic_impresiones_listado (clinic_id, created_at desc);

alter table public.clinic_impresiones_listado enable row level security;
