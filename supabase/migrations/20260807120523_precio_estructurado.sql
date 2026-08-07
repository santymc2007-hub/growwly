-- Rango de precio estructurado (antes solo existía como texto libre).
-- rango_precios (texto) se mantiene como campo de notas adicionales
-- para casos con estructuras de precio complejas (por sesión, etc.).
alter table public.clinics
  add column if not exists precio_desde integer,
  add column if not exists precio_hasta integer;

comment on column public.clinics.precio_desde is 'Precio "desde", en euros, de 500 en 500';
comment on column public.clinics.precio_hasta is 'Precio "hasta", en euros, de 500 en 500';
comment on column public.clinics.rango_precios is 'Notas de precio libres (para casos que no encajan en un rango simple, ej. precio por sesión)';
