-- Ciudad del paciente en la solicitud (faltaba para poder segmentar
-- por zona geográfica).
alter table public.solicitudes_presupuesto
  add column if not exists ciudad text;

comment on column public.solicitudes_presupuesto.ciudad is 'Ciudad del paciente, para segmentar qué clínicas se notifican';

-- Cada fila = "esta clínica fue notificada de esta solicitud". El token
-- es la clave de acceso al enlace del email (no requiere que la clínica
-- tenga cuenta/login todavía — eso llega en la Fase 6).
create table if not exists public.leads_clinica (
  id                uuid primary key default gen_random_uuid(),
  solicitud_id      uuid not null references public.solicitudes_presupuesto (id) on delete cascade,
  clinic_id         uuid not null references public.clinics (id) on delete cascade,
  token             uuid not null default gen_random_uuid(),
  estado            text not null default 'enviado',
  enviado_en        timestamptz not null default now(),
  visto_en          timestamptz,
  desbloqueado_en   timestamptz,
  unique (solicitud_id, clinic_id)
);

comment on table public.leads_clinica is 'Notificación de una solicitud de presupuesto a una clínica concreta, con enlace de acceso por token';
comment on column public.leads_clinica.estado is 'enviado | visto | desbloqueado';
comment on column public.leads_clinica.token is 'Token secreto del enlace del email — es el único "acceso", no requiere login de la clínica todavía';

create unique index if not exists leads_clinica_token_idx on public.leads_clinica (token);

-- Solo el backend (clave secreta, saltándose RLS) gestiona esta tabla:
-- ni el paciente ni un visitante anónimo deben poder leerla directamente
-- por su cuenta — el acceso público real pasa por conocer el token,
-- que se comprueba desde el servidor con la clave admin.
alter table public.leads_clinica enable row level security;
