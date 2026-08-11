-- Ampliación del panel de clínica: visibilidad en 3 sitios distintos
-- (mismo patrón de solicitar/aprobar que ya existe para destacado/plan),
-- horario estructurado por día, y datos de facturación (NUNCA datos de
-- pago reales — eso pasará siempre por una pasarela tipo Stripe).
alter table public.clinics
  add column if not exists destacado_home boolean not null default false,
  add column if not exists destacado_home_solicitado boolean not null default false,
  add column if not exists destacado_ciudad boolean not null default false,
  add column if not exists destacado_ciudad_solicitado boolean not null default false,
  add column if not exists horarios_estructurados jsonb not null default '[]'::jsonb,
  add column if not exists datos_facturacion jsonb;

comment on column public.clinics.destacado_home is 'Aparece en "Clínicas destacadas" de la home';
comment on column public.clinics.destacado_ciudad is 'Aparece destacada dentro de su página de ciudad (/clinicas/[ciudad])';
comment on column public.clinics.horarios_estructurados is 'Array de 7 días: [{dia, abierto, desde, hasta}]. El campo "horarios" (texto libre) se mantiene como alternativa/legado';
comment on column public.clinics.datos_facturacion is '{titular, nif_cif, email_facturacion} — solo referencia para facturar, nunca datos de pago reales';
