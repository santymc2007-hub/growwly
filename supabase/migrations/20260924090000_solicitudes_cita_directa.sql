create table if not exists public.solicitudes_cita_directa (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references public.clinics (id) on delete cascade,
  nombre      text not null,
  telefono    text not null,
  email       text,
  mensaje     text,
  creado_en   timestamptz not null default now()
);

comment on table public.solicitudes_cita_directa is 'Petición de cita directa a una clínica concreta desde su ficha pública — sin login y sin repartirse entre varias clínicas, a diferencia de leads_clinica.';

create index if not exists solicitudes_cita_directa_clinic_id_idx on public.solicitudes_cita_directa (clinic_id);

-- Solo el backend (clave secreta) escribe/lee aquí: ni el visitante
-- anónimo ni la clínica tienen acceso directo por RLS todavía.
alter table public.solicitudes_cita_directa enable row level security;
