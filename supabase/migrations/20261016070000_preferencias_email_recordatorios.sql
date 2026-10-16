-- Preferencia de recordatorios por email, separada del consentimiento
-- de marketing (acepta_marketing_email). Los recordatorios tienen que
-- ver con el servicio que el paciente ya usa (art. 21.2 LSSI), así que
-- van activados por defecto, pero se pueden desactivar en Mi cuenta o
-- desde el enlace de baja de cada email. Ya aplicado en Supabase.
alter table public.profiles add column if not exists acepta_recordatorios_email boolean not null default true;
comment on column public.profiles.acepta_recordatorios_email is 'Recordatorios del servicio por email (presupuesto pendiente tras la valoración, valorar la clínica tras la cita). Activados por defecto; se pueden desactivar en Mi cuenta o desde el enlace de baja de cada email. Los avisos transaccionales (propuestas, citas) no dependen de esto.';
-- El paciente puede cambiarla desde el navegador (ver la lista de
-- columnas editables en 20261014220000_seguridad_profiles_roles.sql).
grant update (acepta_recordatorios_email) on public.profiles to authenticated;
