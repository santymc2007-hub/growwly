create table if not exists public.propuestas_clinica (
  id                uuid primary key default gen_random_uuid(),
  lead_id           uuid not null unique references public.leads_clinica (id) on delete cascade,
  tratamiento       text,
  tipo_precio       text not null,
  precio_min        numeric,
  precio_max        numeric,
  tipo_consulta     text,
  disponibilidad    text,
  incluye           text[] not null default '{}'::text[],
  mensaje           text,
  valido_hasta      date,
  creado_en         timestamptz not null default now(),
  actualizado_en    timestamptz not null default now(),

  constraint propuestas_clinica_tipo_precio_check
    check (tipo_precio in ('cerrado', 'desde', 'rango', 'valoracion')),
  constraint propuestas_clinica_tipo_consulta_check
    check (tipo_consulta is null or tipo_consulta in ('presencial', 'videollamada', 'ambas'))
);

comment on table public.propuestas_clinica is 'Fase 4 del sistema de leads: la respuesta estructurada de una clínica a un lead ("proposal", no "budget" — internamente y de cara al paciente es una propuesta orientativa, no un presupuesto cerrado médico). Uno por lead (una clínica solo tiene una propuesta activa por paciente; V1 no versiona borradores, cada guardado sobrescribe).';
comment on column public.propuestas_clinica.tipo_precio is 'cerrado | desde | rango | valoracion (necesita valoración previa, sin precio todavía)';
comment on column public.propuestas_clinica.incluye is 'Ej: intervencion, valoracion_medica, medicacion, prp, revisiones, hotel, traslado';

-- Igual que leads_clinica/lead_events: solo el backend con la clave
-- secreta escribe/lee aquí por ahora. El acceso del paciente (Fase 5)
-- se diseñará entonces con cuidado, junto con la liberación de
-- contacto — no antes.
alter table public.propuestas_clinica enable row level security;

-- Se registra cuándo se manda la primera propuesta de este lead, al
-- lado de visto_en/desbloqueado_en que ya existían.
alter table public.leads_clinica
  add column if not exists propuesta_enviada_en timestamptz;
