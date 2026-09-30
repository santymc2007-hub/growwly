-- Contador propio de vistas de ficha y de clics de contacto, para las
-- estadísticas de clínica/admin. Se usa un registro propio (en vez de
-- depender solo de Google Analytics) porque: 1) no depende de que el
-- visitante acepte las cookies analíticas, 2) es el dato que se le
-- enseña a la clínica como argumento de valor, así que conviene que
-- sea exacto y no dependa de un tercero.
create table if not exists public.clinic_page_views (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references public.clinics (id) on delete cascade,
  created_at  timestamptz not null default now()
);

create index if not exists clinic_page_views_clinic_id_created_at_idx
  on public.clinic_page_views (clinic_id, created_at desc);

alter table public.clinic_page_views enable row level security;

create table if not exists public.clinic_contact_clicks (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references public.clinics (id) on delete cascade,
  metodo      text not null,
  created_at  timestamptz not null default now()
);

comment on column public.clinic_contact_clicks.metodo is 'llamar | whatsapp | web | reserva_online';

create index if not exists clinic_contact_clicks_clinic_id_created_at_idx
  on public.clinic_contact_clicks (clinic_id, created_at desc);

alter table public.clinic_contact_clicks enable row level security;
