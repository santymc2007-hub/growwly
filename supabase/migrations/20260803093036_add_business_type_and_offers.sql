-- Campos para distinguir tipo de negocio (clínica especializada en
-- capilar vs. estética general que también ofrece capilar), listar
-- sus otros servicios, y marcar ofertas activas.
alter table public.clinics
  add column if not exists tipo_negocio text,
  add column if not exists servicios_adicionales text[] not null default '{}'::text[],
  add column if not exists tiene_oferta boolean not null default false,
  add column if not exists detalle_oferta text;

comment on column public.clinics.tipo_negocio is 'Ej. "Especializada en capilar" o "Estética general con capilar"';
comment on column public.clinics.servicios_adicionales is 'Otros servicios que ofrece el centro, más allá de lo capilar (ej. medicina estética, cirugía plástica)';
comment on column public.clinics.tiene_oferta is 'Si tiene alguna oferta/promoción activa';
comment on column public.clinics.detalle_oferta is 'Descripción de la oferta activa, si la tiene';
