-- Fase 5 del sistema de leads: cuándo el paciente elige esta clínica,
-- al lado de visto_en/desbloqueado_en/propuesta_enviada_en. Con esto
-- la línea de tiempo visual deja de tener que aproximar por posición
-- el paso "Elegido por el paciente".
alter table public.leads_clinica
  add column if not exists seleccionado_en timestamptz;
