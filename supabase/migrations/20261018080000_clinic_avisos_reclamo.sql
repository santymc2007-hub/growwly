-- Avisos "reclama tu ficha" enviados a centros sin cuenta, y bajas de
-- esos avisos. Solo la clave secreta (admin) lee y escribe: RLS activo y
-- sin políticas.
create table if not exists public.clinic_avisos_reclamo (
  clinic_id  uuid primary key references public.clinics(id) on delete cascade,
  enviado_en timestamptz,
  enviado_a  text,
  veces      integer not null default 0,
  baja_en    timestamptz
);

alter table public.clinic_avisos_reclamo enable row level security;

comment on table public.clinic_avisos_reclamo is
  'Email informativo "reclama tu ficha" a centros sin cuenta: último envío, nº de envíos y baja. Solo admin.';
