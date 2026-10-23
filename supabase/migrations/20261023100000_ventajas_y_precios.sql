-- Datos comparables de cada clínica para el buscador/comparador con IA
-- (decisión de Santy, 23 oct 2026). Los rellena cualquier clínica que
-- haya reclamado su ficha (también Básico): el comparador es neutral.

-- 1. Campos con opciones fijas (se comparan cara a cara).
alter table public.clinics
  add column if not exists financiacion_tipo text
    check (financiacion_tipo in ('no', 'con_intereses', 'sin_intereses', 'si')),
  add column if not exists parking text
    check (parking in ('propio_gratis', 'propio_pago', 'cercano', 'no')),
  add column if not exists quien_opera text
    check (quien_opera in ('medico', 'medico_equipo')),
  add column if not exists revisiones_num integer check (revisiones_num between 0 and 20),
  add column if not exists seguimiento_meses integer check (seguimiento_meses between 0 and 60),
  add column if not exists garantia boolean,
  add column if not exists garantia_condiciones text,
  add column if not exists max_uf_sesion integer check (max_uf_sesion between 0 and 10000),
  add column if not exists anios_experiencia integer check (anios_experiencia between 0 and 80),
  add column if not exists injertos_anio integer check (injertos_anio between 0 and 100000);

-- Lo que ya había marcado como "ofrecemos financiación" pasa a "sí"
-- (sin detallar intereses) hasta que la clínica lo concrete.
update public.clinics set financiacion_tipo = 'si'
  where financiacion and financiacion_tipo is null;

-- 2. Catálogo de "valores añadidos" (sí / sin indicar). Las clínicas
-- pueden proponer nuevos; solo los aprobados por el admin se ofrecen a
-- todas.
create table if not exists public.ventajas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria text not null default 'otros'
    check (categoria in ('dia_intervencion', 'despues', 'acceso', 'confianza', 'otros')),
  destacada boolean not null default false,
  orden integer not null default 100,
  estado text not null default 'propuesta'
    check (estado in ('aprobada', 'propuesta', 'descartada', 'archivada')),
  propuesta_por uuid references public.clinics(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.ventajas enable row level security;
create policy "ventajas aprobadas publicas" on public.ventajas
  for select using (estado = 'aprobada');

create table if not exists public.clinic_ventajas (
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  ventaja_id uuid not null references public.ventajas(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (clinic_id, ventaja_id)
);
alter table public.clinic_ventajas enable row level security;
create policy "clinic_ventajas publicas" on public.clinic_ventajas
  for select using (true);

insert into public.ventajas (nombre, categoria, destacada, orden, estado) values
  ('Habitación privada con sofá y baño', 'dia_intervencion', true, 10, 'aprobada'),
  ('Sin dolor / sedación', 'dia_intervencion', true, 20, 'aprobada'),
  ('Comida incluida durante la jornada', 'dia_intervencion', false, 30, 'aprobada'),
  ('Se puede ir con acompañante', 'dia_intervencion', false, 40, 'aprobada'),
  ('Wifi y TV durante la intervención', 'dia_intervencion', false, 50, 'aprobada'),
  ('Recogida en aeropuerto u hotel', 'dia_intervencion', false, 60, 'aprobada'),
  ('Alojamiento concertado', 'dia_intervencion', false, 70, 'aprobada'),
  ('Primer lavado en la clínica', 'despues', false, 10, 'aprobada'),
  ('Primer corte de pelo', 'despues', false, 20, 'aprobada'),
  ('PRP postinjerto incluido', 'despues', false, 30, 'aprobada'),
  ('Medicación y kit postoperatorio incluidos', 'despues', false, 40, 'aprobada'),
  ('Seguimiento por WhatsApp con el médico', 'despues', false, 50, 'aprobada'),
  ('Ascensor', 'acceso', false, 10, 'aprobada'),
  ('Bien comunicado en transporte público', 'acceso', false, 20, 'aprobada'),
  ('Horario de tarde', 'acceso', false, 30, 'aprobada'),
  ('Abre los sábados', 'acceso', false, 40, 'aprobada'),
  ('Especializada solo en salud capilar', 'confianza', false, 10, 'aprobada');

-- 3. Tratamientos y precios por clínica. Sustituye a "Otros servicios"
-- y al rango único de injerto. `visible = false`: el precio no se
-- enseña al paciente, pero la clínica entra igual en comparativas.
create table if not exists public.clinic_precios (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  tratamiento text not null,
  modalidad text not null default 'total'
    check (modalidad in ('total', 'sesion', 'bono', 'norwood', 'uf')),
  desde integer check (desde >= 0),
  hasta integer check (hasta >= 0),
  -- Solo modalidad 'norwood': {"II-III": {"desde": 2500, "hasta": 3500}, ...}
  norwood jsonb,
  nota text,
  visible boolean not null default true,
  orden integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists clinic_precios_clinic_idx on public.clinic_precios (clinic_id, orden);
alter table public.clinic_precios enable row level security;
-- Lectura pública solo de la fila (tratamiento) cuando el precio es visible;
-- los no visibles se leen desde el servidor con la clave secreta.
create policy "clinic_precios visibles" on public.clinic_precios
  for select using (visible);

-- Lo que había: rango de injerto + "Otros servicios" → filas nuevas.
insert into public.clinic_precios (clinic_id, tratamiento, modalidad, desde, hasta, nota, orden)
select id, 'Injerto capilar', 'total', precio_desde, precio_hasta, rango_precios, 0
from public.clinics
where (precio_desde is not null or precio_hasta is not null)
  and not exists (select 1 from public.clinic_precios p where p.clinic_id = clinics.id);

insert into public.clinic_precios (clinic_id, tratamiento, orden)
select c.id, s.servicio, 10 + s.n
from public.clinics c
cross join lateral unnest(c.servicios_adicionales) with ordinality as s(servicio, n)
where not exists (
  select 1 from public.clinic_precios p
  where p.clinic_id = c.id and lower(p.tratamiento) = lower(s.servicio)
);
