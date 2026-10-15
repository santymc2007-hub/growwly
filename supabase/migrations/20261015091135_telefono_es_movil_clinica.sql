alter table public.clinics
  add column if not exists telefono_es_movil boolean not null default true;

comment on column public.clinics.telefono_es_movil is 'Indica si el teléfono guardado es un móvil (acepta WhatsApp) o una línea fija — controla si se muestra el botón de WhatsApp en la ficha pública. Default true para no ocultar WhatsApp en los teléfonos ya guardados hasta que la clínica o el admin lo revisen.';
