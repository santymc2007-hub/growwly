-- Captura del email al mostrar la valoración (auditoría CRO, tarea 10).
-- Se guarda en el propio estudio anónimo antes de crear la cuenta, para
-- no perder el contacto si la persona no llega a introducir el código.
-- Se borra con el estudio (limpieza a los 6 meses si nunca se reclama).
alter table public.estudios_capilares
  add column if not exists email_contacto text,
  add column if not exists nombre_contacto text,
  add column if not exists email_capturado_en timestamptz;

comment on column public.estudios_capilares.email_contacto is
  'Email que dejó la persona al ver el adelanto de su valoración (antes de tener cuenta).';
comment on column public.estudios_capilares.email_capturado_en is
  'Primera vez que dejó el email en el adelanto de la valoración.';

create index if not exists estudios_capilares_email_pendiente_idx
  on public.estudios_capilares (email_capturado_en)
  where user_id is null and email_contacto is not null;
