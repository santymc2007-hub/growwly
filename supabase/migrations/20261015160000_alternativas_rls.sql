-- La tabla solicitudes_cita_directa_alternativas se creó (15 oct) sin
-- RLS: con la clave pública cualquiera podía leer sus tokens y, con
-- ellos, reenviar el nombre y teléfono de un paciente a otra clínica.
-- Solo la usa el servidor con la clave secreta (cron de alternativas y
-- /api/solicitudes/reenviar), así que basta con cerrarla. Ya aplicado
-- en Supabase.
alter table public.solicitudes_cita_directa_alternativas enable row level security;
revoke all on public.solicitudes_cita_directa_alternativas from anon, authenticated;
