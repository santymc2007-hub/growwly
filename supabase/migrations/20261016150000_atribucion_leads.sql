-- Atribución de campaña (gclid, gbraid, wbraid, fbclid, utm_*, landing,
-- fecha) de cada lead, para saber qué anuncios traen solicitudes. Solo se
-- rellena si el paciente aceptó las cookies de publicidad.
alter table public.solicitudes_cita_directa add column if not exists atribucion jsonb;
alter table public.solicitudes_presupuesto add column if not exists atribucion jsonb;

comment on column public.solicitudes_cita_directa.atribucion is
  'Campaña de origen (gclid, fbclid, utm_*…) si el visitante aceptó publicidad. Null si no.';
comment on column public.solicitudes_presupuesto.atribucion is
  'Campaña de origen (gclid, fbclid, utm_*…) si el visitante aceptó publicidad. Null si no.';
