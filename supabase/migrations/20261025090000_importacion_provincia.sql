-- Importación masiva de centros por provincia (Apify Google Maps Scraper).
-- Una búsqueda lanza una ejecución en Apify; sus resultados se guardan
-- como candidatos que el admin importa (con el importador de siempre:
-- web + Google, revisión y ficha sin publicar) o descarta.
-- Solo service_role: RLS activado sin políticas.

create table if not exists public.importaciones_provincia (
  id uuid primary key default gen_random_uuid(),
  provincia text not null,
  zona_busqueda text not null,
  run_id text not null,
  dataset_id text,
  estado text not null default 'en_curso'
    check (estado in ('en_curso', 'terminada', 'fallida', 'cargada')),
  total_resultados integer,
  created_at timestamptz not null default now(),
  cargada_at timestamptz
);

create table if not exists public.importacion_candidatos (
  id uuid primary key default gen_random_uuid(),
  importacion_id uuid not null references public.importaciones_provincia(id) on delete cascade,
  place_id text not null,
  nombre text not null,
  categoria text,
  direccion text,
  municipio text,
  telefono text,
  web text,
  rating numeric,
  resenas integer,
  maps_url text,
  datos jsonb not null default '{}'::jsonb,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'descartado', 'importado', 'ya_en_growwly')),
  motivo text,
  clinic_id uuid references public.clinics(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (importacion_id, place_id)
);

create index if not exists importacion_candidatos_importacion_idx
  on public.importacion_candidatos (importacion_id, estado);

alter table public.importaciones_provincia enable row level security;
alter table public.importacion_candidatos enable row level security;

comment on table public.importaciones_provincia is
  'Búsquedas masivas de centros por provincia lanzadas en Apify desde /admin/clinicas/importar-provincia. Solo servidor.';
comment on table public.importacion_candidatos is
  'Centros encontrados por una importación de provincia, pendientes de importar o descartar. Solo servidor.';
