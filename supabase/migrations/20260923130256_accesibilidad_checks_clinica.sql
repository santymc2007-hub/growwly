-- Accesibilidad como lista de comprobaciones seleccionables (en vez
-- de solo texto libre), para poder mostrar iconos en la ficha
-- pública. accesibilidad (texto libre) se mantiene para notas.
alter table public.clinics
  add column if not exists accesibilidad_checks text[] not null default '{}';

comment on column public.clinics.accesibilidad_checks is 'Comprobaciones de accesibilidad seleccionadas: entrada_sin_escalones, pasillos_amplios, aseos_adaptados, mobiliario_ajustable, senalizacion_clara';
