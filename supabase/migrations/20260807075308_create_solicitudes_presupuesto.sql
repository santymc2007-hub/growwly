-- Solicitudes de presupuesto: el formulario de 6 pasos que rellena el
-- paciente para pedir presupuesto. Es la "ficha" que en la Fase 4 se
-- mandará segmentada a las clínicas.
create table if not exists public.solicitudes_presupuesto (
  id                            uuid primary key default gen_random_uuid(),
  user_id                       uuid not null references public.profiles (id) on delete cascade,
  estudio_id                    uuid references public.estudios_capilares (id) on delete set null,

  -- Paso 2: Historial capilar
  progresion_perdida            text,
  antecedentes_familiares       text,
  medicacion_actual             text,

  -- Paso 3: Tratamientos de interés
  tratamientos_interes          text[] not null default '{}'::text[],
  dejar_decidir_medico          boolean not null default false,

  -- Paso 4: Preferencias
  cuando_tratamiento            text,
  donde_tratamiento             text,
  presupuesto_rango             text,

  -- Paso 6: Consentimientos (con fecha, para poder demostrar cuándo se dieron)
  consentimiento_datos_en       timestamptz,
  consentimiento_compartir_en   timestamptz,

  estado                        text not null default 'pendiente',

  created_at                    timestamptz not null default now()
);

comment on table public.solicitudes_presupuesto is 'Solicitud de presupuesto del paciente (formulario de 6 pasos)';
comment on column public.solicitudes_presupuesto.progresion_perdida is 'lenta | moderada | rapida';
comment on column public.solicitudes_presupuesto.cuando_tratamiento is 'inmediatamente | 3_meses | este_anio';
comment on column public.solicitudes_presupuesto.donde_tratamiento is 'solo_ciudad | abierto_viajar';
comment on column public.solicitudes_presupuesto.presupuesto_rango is 'menos_3000 | 3000_5000 | 5000_7000 | mas_7000';
comment on column public.solicitudes_presupuesto.estado is 'pendiente | enviada | con_propuestas | cerrada';

alter table public.solicitudes_presupuesto enable row level security;

drop policy if exists "Los pacientes ven sus propias solicitudes" on public.solicitudes_presupuesto;
create policy "Los pacientes ven sus propias solicitudes"
on public.solicitudes_presupuesto
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Los pacientes crean sus propias solicitudes" on public.solicitudes_presupuesto;
create policy "Los pacientes crean sus propias solicitudes"
on public.solicitudes_presupuesto
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Los pacientes borran sus propias solicitudes" on public.solicitudes_presupuesto;
create policy "Los pacientes borran sus propias solicitudes"
on public.solicitudes_presupuesto
for delete
to authenticated
using (auth.uid() = user_id);
