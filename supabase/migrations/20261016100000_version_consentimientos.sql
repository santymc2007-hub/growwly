-- Versión de los textos legales aceptados en cada consentimiento
-- (art. 7.1 RGPD: hay que poder demostrar a qué se consintió, no solo
-- cuándo). El valor viene de VERSION_TEXTOS_LEGALES en
-- src/lib/legal/version.ts.
alter table public.estudios_capilares add column if not exists consentimiento_version text;
alter table public.solicitudes_presupuesto add column if not exists consentimiento_version text;

-- La petición de cita desde la ficha no guardaba consentimiento ni
-- tenía límite de envíos: se añaden fecha, versión y huella de IP
-- (esta se borra a los 30 días, cron limpieza-datos).
alter table public.solicitudes_cita_directa add column if not exists consentimiento_en timestamptz;
alter table public.solicitudes_cita_directa add column if not exists consentimiento_version text;
alter table public.solicitudes_cita_directa add column if not exists ip_hash text;

create index if not exists solicitudes_cita_directa_ip_hash_idx
  on public.solicitudes_cita_directa (ip_hash, creado_en)
  where ip_hash is not null;
