alter table public.leads_clinica
  add constraint leads_clinica_estado_check
  check (estado in (
    'enviado',
    'visto',
    'desbloqueado',
    'propuesta_enviada',
    'seleccionado',
    'no_seleccionado',
    'cita_pendiente',
    'cita_programada',
    'cita_realizada',
    'convertido',
    'no_convertido',
    'cancelado'
  ));

comment on column public.leads_clinica.estado is 'Pipeline completo del lead PARA ESTA CLÍNICA (una solicitud puede repartirse a varias clínicas, cada una con su propio estado): enviado -> visto -> desbloqueado -> propuesta_enviada -> seleccionado|no_seleccionado -> cita_pendiente -> cita_programada -> cita_realizada -> convertido|no_convertido. cancelado puede llegar desde varios puntos. La interfaz solo enseña enviado/visto/desbloqueado por ahora (Fase 1-2 ya en producción); el resto del pipeline se activa por fases (propuesta = Fase 4, selección/cita = Fase 5-6) sin tocar la UI existente.';
