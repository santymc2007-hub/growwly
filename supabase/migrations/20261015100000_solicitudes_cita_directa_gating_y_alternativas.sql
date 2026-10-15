alter table public.solicitudes_cita_directa
  add column if not exists respondida_en timestamptz,
  add column if not exists alternativas_enviadas_en timestamptz;

comment on column public.solicitudes_cita_directa.respondida_en is 'Cuándo marcó la clínica esta solicitud como respondida. Si sigue en null pasadas 48h, el cron de alternativas la procesa.';
comment on column public.solicitudes_cita_directa.alternativas_enviadas_en is 'Cuándo se procesó esta solicitud para ofrecer alternativas al paciente (se marca aunque no hubiera ninguna clínica alternativa disponible, para no reprocesar cada día).';

create table if not exists public.solicitudes_cita_directa_alternativas (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null references public.solicitudes_cita_directa(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  token text not null unique,
  creado_en timestamptz not null default now(),
  enviada_en timestamptz
);

create index if not exists idx_solicitudes_cita_directa_alt_token
  on public.solicitudes_cita_directa_alternativas (token);

comment on table public.solicitudes_cita_directa_alternativas is 'Clínicas alternativas que el cron de "sin respuesta" propone al paciente por email. Cada fila es un enlace de un solo uso (token) que, al clicarlo, crea una nueva solicitud_cita_directa hacia esa clínica.';
