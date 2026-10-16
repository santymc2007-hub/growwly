-- Denuncias de contenido (Reglamento de Servicios Digitales, art. 16):
-- cualquiera puede avisar de una ficha, reseña o texto que crea ilegal
-- o falso desde /denunciar. Se guarda aquí para tramitarlo y para
-- poder demostrar qué se recibió y qué se hizo.
--
-- Solo la escribe y la lee el servidor (clave secreta): RLS activado
-- sin políticas. La huella de IP (para limitar abusos) se borra a los
-- 30 días y la denuncia a los 2 años (cron limpieza-datos).
create table if not exists public.denuncias_contenido (
  id uuid primary key default gen_random_uuid(),
  url text not null check (char_length(url) <= 500),
  motivo text not null check (motivo in (
    'informacion_falsa', 'resena_falsa', 'publicidad_sanitaria',
    'datos_personales', 'propiedad_intelectual', 'otro'
  )),
  explicacion text not null check (char_length(explicacion) between 10 and 4000),
  nombre text check (char_length(nombre) <= 200),
  email text check (char_length(email) <= 320),
  buena_fe boolean not null default false,
  estado text not null default 'recibida' check (estado in ('recibida', 'en_revision', 'retirado', 'desestimada')),
  resolucion text,
  ip_hash text,
  creado_en timestamptz not null default now()
);

alter table public.denuncias_contenido enable row level security;
revoke all on public.denuncias_contenido from anon, authenticated;

create index if not exists denuncias_contenido_ip_hash_idx
  on public.denuncias_contenido (ip_hash, creado_en)
  where ip_hash is not null;

comment on table public.denuncias_contenido is 'Denuncias de contenido ilegal o falso (DSA art. 16), enviadas desde /denunciar. Solo servidor.';
