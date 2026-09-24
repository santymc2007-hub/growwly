-- Fase 6 del sistema de leads: cita/seguimiento (sin integraciones
-- externas de calendario todavía — la fecha se guarda tal cual la
-- introduce la clínica). Columnas de fecha por estado, igual que las
-- de fases anteriores (visto_en, desbloqueado_en...), más el
-- feedback del paciente tras la cita.
alter table public.leads_clinica
  add column if not exists fecha_cita timestamptz,
  add column if not exists cita_pendiente_en timestamptz,
  add column if not exists cita_programada_en timestamptz,
  add column if not exists cita_realizada_en timestamptz,
  add column if not exists convertido_en timestamptz,
  add column if not exists no_convertido_en timestamptz,
  add column if not exists feedback_puntuacion smallint,
  add column if not exists feedback_comentario text,
  add column if not exists feedback_recibido_en timestamptz,
  add column if not exists recordatorio_feedback_enviado_en timestamptz;

alter table public.leads_clinica
  add constraint leads_clinica_feedback_puntuacion_check
  check (feedback_puntuacion is null or feedback_puntuacion between 1 and 5);

comment on column public.leads_clinica.fecha_cita is 'Fecha/hora de la cita que programa la clínica — a mano, sin calendario externo conectado (fuera de alcance del V1).';
comment on column public.leads_clinica.recordatorio_feedback_enviado_en is 'Para que el cron de recordatorio de feedback no mande el email dos veces al mismo lead.';
