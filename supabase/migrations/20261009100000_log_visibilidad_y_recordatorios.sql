-- Log de altas/bajas de cada tipo de visibilidad (destacado,
-- destacado_home, destacado_ciudad, premium) — para poder facturar por
-- el histórico real de cuándo estuvo activo cada uno, cosa que
-- clinics.visibilidad_fechas no puede dar porque se sobrescribe/borra
-- en cada ciclo de alta-baja (solo guarda el estado actual).
create table if not exists public.clinic_visibilidad_log (
  id              uuid primary key default gen_random_uuid(),
  clinic_id       uuid not null references public.clinics (id) on delete cascade,
  tipo            text not null check (tipo in ('destacado', 'destacado_home', 'destacado_ciudad', 'premium')),
  accion          text not null check (accion in ('alta', 'baja')),
  meses_duracion  integer,
  expira_en       timestamptz,
  motivo          text not null check (motivo in ('aprobado_admin', 'desactivado_admin', 'rechazado_admin', 'expirado')),
  creado_en       timestamptz not null default now()
);

create index if not exists clinic_visibilidad_log_clinic_id_idx
  on public.clinic_visibilidad_log (clinic_id, creado_en desc);

alter table public.clinic_visibilidad_log enable row level security;

-- Recordatorio (único, de momento) al paciente que terminó su
-- valoración con IA pero nunca llegó a pedir presupuesto — evita
-- mandarlo más de una vez por estudio.
alter table public.estudios_capilares
  add column if not exists recordatorio_presupuesto_enviado_en timestamptz;
