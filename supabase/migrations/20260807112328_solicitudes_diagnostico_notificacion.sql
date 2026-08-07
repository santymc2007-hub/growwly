-- Para poder ver, sin bucear en logs, cuántas clínicas se notificaron
-- de una solicitud (o por qué falló el aviso).
alter table public.solicitudes_presupuesto
  add column if not exists clinicas_notificadas integer,
  add column if not exists notificacion_error text;

comment on column public.solicitudes_presupuesto.clinicas_notificadas is 'Nº de clínicas a las que se avisó por email; null = todavía no se ha intentado';
comment on column public.solicitudes_presupuesto.notificacion_error is 'Detalle técnico si el envío de avisos falló';
