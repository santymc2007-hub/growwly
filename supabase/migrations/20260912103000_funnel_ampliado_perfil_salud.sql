-- Ampliación del funnel de solicitud de presupuesto (formulario de 6
-- pasos): Perfil Personal gana sexo y tipo de pérdida de cabello,
-- Preferencias gana prioridad de decisión, vuelve el paso de Salud
-- General, y Consentimientos pasa de 2 a 5 casillas individuales.

-- Perfil Personal: datos que describen al paciente y no cambian entre
-- solicitudes, igual que nombre/apellidos/edad ya existentes.
alter table public.profiles
  add column if not exists sexo text,
  add column if not exists tipo_perdida_cabello text;

comment on column public.profiles.sexo is 'hombre | mujer';
comment on column public.profiles.tipo_perdida_cabello is 'entradas | coronilla | difusa | combinada';

-- Preferencias: nueva pregunta de prioridad. cuando_tratamiento,
-- donde_tratamiento y presupuesto_rango ya existían; solo cambian los
-- valores que aceptan (ver comentarios actualizados), no la columna.
alter table public.solicitudes_presupuesto
  add column if not exists prioridad_decision text;

comment on column public.solicitudes_presupuesto.prioridad_decision is 'reputacion_cirujano | resenas_fotos | tecnologia | precio';
comment on column public.solicitudes_presupuesto.cuando_tratamiento is 'lo_antes_posible | 1_3_meses | 3_6_meses | 6_12_meses | flexible';
comment on column public.solicitudes_presupuesto.donde_tratamiento is 'ciudad | provincia | comunidad | sin_preferencia';
comment on column public.solicitudes_presupuesto.presupuesto_rango is 'valor en euros como texto ("500".."20000", múltiplos de 500) | flexible';

-- Salud General: vuelve al formulario (se había quitado "por ahora" en
-- la Fase 1). condiciones_medicas admite varias + un valor especial
-- 'ninguna' que se excluye mutuamente con el resto en el formulario.
alter table public.solicitudes_presupuesto
  add column if not exists alergias text,
  add column if not exists condiciones_medicas text[] not null default '{}'::text[],
  add column if not exists cirugias_previas text,
  add column if not exists fumador text;

comment on column public.solicitudes_presupuesto.condiciones_medicas is 'diabetes | hipertension | problemas_cardiacos | trastornos_coagulacion | enfermedades_autoinmunes | problemas_tiroideos | depresion_ansiedad | ninguna';
comment on column public.solicitudes_presupuesto.fumador is 'no_fumo | ocasional | regular';

-- Consentimientos: de 2 a 5 casillas individuales. Las 2 que ya
-- existían se reutilizan (política de privacidad -> datos; 
-- comunicaciones de clínicas -> compartir) y se añaden las 3 nuevas.
alter table public.solicitudes_presupuesto
  add column if not exists consentimiento_info_medica_en timestamptz,
  add column if not exists consentimiento_fotos_en timestamptz,
  add column if not exists consentimiento_terminos_en timestamptz;

comment on column public.solicitudes_presupuesto.consentimiento_datos_en is 'Política de privacidad';
comment on column public.solicitudes_presupuesto.consentimiento_compartir_en is 'Comunicaciones: recibir comunicaciones de clínicas especializadas';
comment on column public.solicitudes_presupuesto.consentimiento_info_medica_en is 'Confirma que la información médica proporcionada es veraz y completa';
comment on column public.solicitudes_presupuesto.consentimiento_fotos_en is 'Autoriza el uso de sus fotografías únicamente para evaluación médica';
comment on column public.solicitudes_presupuesto.consentimiento_terminos_en is 'Ha leído y acepta los términos y condiciones del servicio';
