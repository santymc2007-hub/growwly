-- Medición semanal de velocidad (PageSpeed Insights) de las páginas clave
-- (auditoría CRO, tarea 17). Solo la escribe el cron con la clave de
-- servicio; nadie la lee desde el navegador.
create table if not exists public.pagespeed_mediciones (
  id uuid primary key default gen_random_uuid(),
  medido_en timestamptz not null default now(),
  url text not null,
  estrategia text not null check (estrategia in ('mobile', 'desktop')),
  puntuacion integer,
  fcp_ms integer,
  lcp_ms integer,
  tbt_ms integer,
  cls numeric,
  speed_index_ms integer,
  lcp_elemento text,
  campo jsonb,
  oportunidades jsonb,
  error text
);

create index if not exists pagespeed_mediciones_url_fecha_idx
  on public.pagespeed_mediciones (url, estrategia, medido_en desc);

alter table public.pagespeed_mediciones enable row level security;
