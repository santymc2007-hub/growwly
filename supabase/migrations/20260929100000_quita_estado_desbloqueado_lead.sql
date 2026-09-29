-- El paso de "desbloquear" un lead desaparece: la clínica ve el
-- perfil completo del paciente (salvo nombre/teléfono/email) desde el
-- momento en que recibe el lead, sin ninguna acción de desbloqueo de
-- por medio. Los leads que ya estaban en "desbloqueado" pasan a
-- "visto" (ya lo habían visto, pero todavía no habían enviado
-- propuesta), que es el estado equivalente en el nuevo pipeline.
update leads_clinica
set estado = 'visto'
where estado = 'desbloqueado';

alter table leads_clinica
  drop constraint leads_clinica_estado_check;

alter table leads_clinica
  add constraint leads_clinica_estado_check
  check (estado = any (array[
    'enviado', 'visto', 'propuesta_enviada', 'seleccionado',
    'no_seleccionado', 'cita_pendiente', 'cita_programada',
    'cita_realizada', 'convertido', 'no_convertido', 'cancelado'
  ]));
