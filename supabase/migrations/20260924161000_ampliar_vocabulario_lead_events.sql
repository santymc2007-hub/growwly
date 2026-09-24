alter table public.lead_events
  add constraint lead_events_event_check
  check (event in (
    'lead_created',
    'lead_assigned',
    'lead_opened',
    'lead_unlocked',
    'proposal_created',
    'proposal_sent',
    'proposal_viewed',
    'clinic_selected',
    'contact_released',
    'appointment_created',
    'appointment_completed',
    'feedback_received',
    'lead_converted',
    'lead_lost'
  ));

comment on column public.lead_events.event is 'Vocabulario completo del ciclo de vida (Fase 3): lead_created | lead_assigned | lead_opened | lead_unlocked ya se registran hoy (Fase 1-2). El resto (proposal_*, clinic_selected, contact_released, appointment_*, feedback_received, lead_converted, lead_lost) se activará en fases posteriores conforme se construyan — están en el vocabulario desde ya para no tener que tocar el esquema otra vez.';
