-- Ampliar el perfil de paciente: fecha de nacimiento estructurada (en
-- vez de solo "edad" suelta) y ciudad, útil para futuras coincidencias
-- con clínicas por zona.
alter table public.profiles
  add column if not exists fecha_nacimiento date,
  add column if not exists ciudad text;

comment on column public.profiles.fecha_nacimiento is 'Sustituye a "edad" (que se mantiene por compatibilidad, sin usarse ya en el formulario)';
