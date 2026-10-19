-- Nuevo modelo de visibilidad de pago (decisión de Santy, 19 oct 2026):
--
-- - Destacado general (columna `destacado`): 8 plazas en total, en la
--   portada y en /centros sin filtro de provincia.
-- - Destacado de provincia (columna nueva `destacado_provincia`): 8
--   plazas por provincia, primero en /centros cuando se filtra por esa
--   provincia (o una ciudad suya) y en las páginas de ciudad.
--
-- `destacado_home` y `destacado_ciudad` (y sus *_solicitado) dejan de
-- usarse; se quedan en la tabla para no romper la versión publicada
-- mientras se despliega. Hoy están todas a false.
alter table public.clinics add column if not exists destacado_provincia boolean not null default false;
alter table public.clinics add column if not exists destacado_provincia_solicitado boolean not null default false;

comment on column public.clinics.destacado_provincia is 'Destacado de pago en su provincia (8 plazas por provincia). Ver src/lib/visibilidad/destacados.ts.';
comment on column public.clinics.destacado is 'Destacado general de pago (8 plazas en total): portada y /centros sin provincia. Ver src/lib/visibilidad/destacados.ts.';

-- El historial admite el tipo nuevo (los antiguos se mantienen para el
-- historial que ya existe).
alter table public.clinic_visibilidad_log drop constraint if exists clinic_visibilidad_log_tipo_check;
alter table public.clinic_visibilidad_log add constraint clinic_visibilidad_log_tipo_check
  check (tipo = any (array['destacado', 'destacado_home', 'destacado_ciudad', 'destacado_provincia', 'premium']));
