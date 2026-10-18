-- Emails que reciben los avisos de leads de cada clínica (oct 2026).
--
-- Hasta ahora todos los avisos (solicitudes de presupuesto del
-- asistente de valoración, peticiones de cita/información desde la
-- ficha, cambios de cita y recordatorios de leads pendientes) iban a
-- clinics.email, que es el email PÚBLICO de la ficha — muchas veces el
-- mismo con el que se dio de alta la clínica, y no necesariamente el
-- de quien atiende a los pacientes.
--
-- emails_leads: hasta 3 direcciones que reciben esos avisos. Vive en
-- clinic_privado (solo servidor) porque no es un dato público. Si está
-- vacío, se sigue usando clinics.email como hasta ahora.

alter table public.clinic_privado
  add column if not exists emails_leads text[] not null default '{}';

alter table public.clinic_privado
  drop constraint if exists clinic_privado_emails_leads_max3;
alter table public.clinic_privado
  add constraint clinic_privado_emails_leads_max3
  check (cardinality(emails_leads) <= 3);

comment on column public.clinic_privado.emails_leads is
  'Hasta 3 emails que reciben los avisos de leads (valoraciones y peticiones de información). Vacío = se usa clinics.email.';
