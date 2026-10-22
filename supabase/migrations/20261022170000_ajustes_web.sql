-- Ajustes generales de la web que se cambian desde el admin
-- (sección "Personalizar"). Una fila por ajuste, valor en JSON.
-- Primer ajuste: "fondo" (fondo de toda la web).
--
-- Lectura pública (el fondo lo pinta cualquier página); escritura solo
-- desde el servidor con la clave secreta (requireAdmin en la acción).
create table if not exists public.ajustes_web (
  clave text primary key,
  valor jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.ajustes_web enable row level security;

drop policy if exists "ajustes_web lectura publica" on public.ajustes_web;
create policy "ajustes_web lectura publica" on public.ajustes_web
  for select using (true);

comment on table public.ajustes_web is 'Ajustes de la web editables desde /admin/personalizar. Ver src/lib/ajustes/fondo.ts.';
