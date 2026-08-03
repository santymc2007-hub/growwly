-- Campos adicionales para clínicas, a partir de los datos que Santy
-- ya tenía recopilados (dirección completa, rango de precios,
-- accesibilidad, horarios y ratings de Google/Doctoralia).
alter table public.clinics
  add column if not exists direccion text,
  add column if not exists rango_precios text,
  add column if not exists accesibilidad text,
  add column if not exists horarios text,
  add column if not exists rating_google numeric(2,1),
  add column if not exists resenas_google integer,
  add column if not exists rating_doctoralia numeric(2,1),
  add column if not exists resenas_doctoralia integer;

comment on column public.clinics.direccion is 'Dirección postal completa';
comment on column public.clinics.rango_precios is 'Texto libre: precios o rango de precios de los tratamientos';
comment on column public.clinics.accesibilidad is 'Notas sobre accesibilidad del local (texto libre)';
comment on column public.clinics.horarios is 'Horario de atención (texto libre)';
comment on column public.clinics.rating_google is 'Nota media en Google (0.0 a 5.0)';
comment on column public.clinics.resenas_google is 'Número de reseñas en Google';
comment on column public.clinics.rating_doctoralia is 'Nota media en Doctoralia (0.0 a 5.0)';
comment on column public.clinics.resenas_doctoralia is 'Número de reseñas en Doctoralia';
