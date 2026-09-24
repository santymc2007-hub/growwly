create table if not exists public.lead_events (
  id            uuid primary key default gen_random_uuid(),
  event         text not null,
  solicitud_id  uuid references public.solicitudes_presupuesto (id) on delete cascade,
  lead_id       uuid references public.leads_clinica (id) on delete cascade,
  clinic_id     uuid references public.clinics (id) on delete set null,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

comment on table public.lead_events is 'Registro de cada paso del ciclo de vida de un lead (Fase 1 del sistema de seguimiento de leads) — base de datos real para poder calcular más adelante el Growwly Score (tiempo de respuesta, % de leads gestionados) en vez de pesos inventados.';
comment on column public.lead_events.event is 'lead_created | lead_assigned | lead_opened | lead_unlocked (se irán añadiendo más en fases posteriores: proposal_sent, clinic_selected, appointment_*, etc.)';

create index if not exists lead_events_clinic_id_idx on public.lead_events (clinic_id);
create index if not exists lead_events_solicitud_id_idx on public.lead_events (solicitud_id);
create index if not exists lead_events_event_idx on public.lead_events (event);
create index if not exists lead_events_created_at_idx on public.lead_events (created_at);

-- Igual que leads_clinica: solo el backend (clave secreta) escribe y
-- lee aquí. No hay acceso público ni de clínica/paciente todavía.
alter table public.lead_events enable row level security;
