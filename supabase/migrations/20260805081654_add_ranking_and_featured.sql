-- Orden manual y destacados: permite al gestor decidir qué clínicas
-- aparecen primero (o destacadas) en el listado público.
alter table public.clinics
  add column if not exists destacado boolean not null default false,
  add column if not exists orden integer not null default 0;

comment on column public.clinics.destacado is 'Si aparece destacada (siempre arriba del listado, con distintivo visual)';
comment on column public.clinics.orden is 'Orden manual dentro de su grupo (destacadas / no destacadas); menor = antes';

create index if not exists clinics_orden_idx on public.clinics (destacado desc, orden asc);
