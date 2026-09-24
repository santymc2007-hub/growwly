alter table public.leads_clinica
  add column if not exists match_score integer;

comment on column public.leads_clinica.match_score is 'Match Score (0-100) calculado en el momento del reparto: cuánto encaja esta clínica en concreto con esta solicitud (ubicación, tratamiento, presupuesto). Se usa para el sello "Tu Match Score es X%" que ve el paciente.';
