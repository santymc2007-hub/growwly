-- Consentimiento de marketing por email — separado del consentimiento
-- operativo de "comunicaciones de clínicas" que ya existe en el paso 6
-- del funnel de solicitud de presupuesto. Este es opcional, desmarcado
-- por defecto, y revocable en cualquier momento desde "Mi cuenta"
-- (RGPD: consentimiento específico, informado e inequívoco, no puede
-- ir premarcado ni empaquetado con otros consentimientos).
alter table public.profiles
  add column if not exists acepta_marketing_email boolean not null default false;

comment on column public.profiles.acepta_marketing_email is 'Consentimiento (opcional, revocable) para recibir emails de marketing/novedades de Growwly — distinto del consentimiento operativo de compartir la solicitud con clínicas.';

-- Nuevas preguntas del paso 2 del funnel de solicitud de presupuesto
-- (síntomas del cuero cabelludo, tratamientos ya probados y cambios de
-- salud recientes) y el código postal del paso 4, más preciso que la
-- ciudad para poder matchear clínicas cercanas más adelante.
alter table public.solicitudes_presupuesto
  add column if not exists sintomas_cuero_cabelludo text[] not null default '{}'::text[],
  add column if not exists tratamientos_usados text[] not null default '{}'::text[],
  add column if not exists tratamientos_usados_detalle text,
  add column if not exists cambios_salud_recientes text,
  add column if not exists codigo_postal text;

comment on column public.solicitudes_presupuesto.sintomas_cuero_cabelludo is 'Síntomas percibidos en el cuero cabelludo (picor, descamación, rojez, granitos, dolor, grasa).';
comment on column public.solicitudes_presupuesto.tratamientos_usados is 'Tratamientos ya probados (minoxidil, finasterida, champús, suplementos, otro).';
comment on column public.solicitudes_presupuesto.tratamientos_usados_detalle is 'Detalle libre de los tratamientos usados: dosis, fechas, efectos secundarios.';
comment on column public.solicitudes_presupuesto.cambios_salud_recientes is 'Cambios de salud recientes: enfermedades, estrés, pérdida de peso, dieta, medicación.';
comment on column public.solicitudes_presupuesto.codigo_postal is 'Código postal para la cirugía — más preciso que "ciudad" para matchear clínicas cercanas.';
