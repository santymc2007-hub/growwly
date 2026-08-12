-- Logo propio de la clínica, distinto de la galería de fotos.
alter table public.clinics
  add column if not exists logo_url text;
