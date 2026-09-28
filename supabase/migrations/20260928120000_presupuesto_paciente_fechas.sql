-- Rediseño de "Mis presupuestos" (paciente):
--  * propuesta_vista_en: el paciente abrió la propuesta de esta clínica
--    (deja de ser "Propuesta nueva").
--  * descartado_por_paciente_en: el paciente dijo "No, gracias" a esta
--    propuesta (pasa a no_seleccionado sin que se libere su contacto).
--  * opciones_cita: tras ser elegida, la clínica propone varias fechas
--    para la valoración y el paciente confirma una. Array jsonb de
--    { "fecha": timestamptz ISO, "modalidad": "presencial"|"videollamada" }.
--  * otras_fechas_pedidas_en: el paciente pidió otras fechas porque
--    ninguna le venía bien.
alter table public.leads_clinica
  add column if not exists propuesta_vista_en timestamptz,
  add column if not exists descartado_por_paciente_en timestamptz,
  add column if not exists opciones_cita jsonb not null default '[]'::jsonb,
  add column if not exists otras_fechas_pedidas_en timestamptz;

comment on column public.leads_clinica.opciones_cita is 'Fechas que la clínica propone para la valoración (estado cita_pendiente). El paciente confirma una y pasa a cita_programada con fecha_cita.';
