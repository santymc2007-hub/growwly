-- De dónde viene cada usuario y en qué punto del embudo se queda.
--
-- 1. Atribución (último clic no directo: anuncio, buscador, red social…)
--    también en las valoraciones y en los clics de contacto de las fichas.
--    Las solicitudes de presupuesto y las de cita directa ya la tenían.
alter table public.estudios_capilares add column if not exists atribucion jsonb;
alter table public.clinic_contact_clicks add column if not exists atribucion jsonb;

-- 2. Embudo propio: un registro por paso, sin ningún identificador de la
--    persona (ni usuario, ni IP, ni cookie). Solo qué paso, desde qué
--    canal y, si hay, el motivo de un error o abandono. Así se puede
--    contar el embudo completo aunque no se acepten las cookies; el canal
--    solo se conoce cuando sí se aceptan (si no, queda "sin_consentimiento").
create table if not exists public.embudo_eventos (
  id bigint generated always as identity primary key,
  paso text not null,
  canal text not null default 'desconocido',
  campana text,
  detalle text,
  created_at timestamptz not null default now(),
  constraint embudo_eventos_paso_largo check (char_length(paso) <= 40),
  constraint embudo_eventos_canal_largo check (char_length(canal) <= 60),
  constraint embudo_eventos_campana_largo check (campana is null or char_length(campana) <= 120),
  constraint embudo_eventos_detalle_largo check (detalle is null or char_length(detalle) <= 120)
);

create index if not exists embudo_eventos_created_at_idx on public.embudo_eventos (created_at desc);
create index if not exists embudo_eventos_paso_created_idx on public.embudo_eventos (paso, created_at desc);

-- Solo escribe y lee el servidor (service role): sin políticas para anon
-- ni para usuarios autenticados.
alter table public.embudo_eventos enable row level security;
