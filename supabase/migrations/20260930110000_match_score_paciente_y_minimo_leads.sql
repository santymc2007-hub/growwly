-- Match Score que ve el paciente: cobertura, no calidad de encaje.
-- Se calcula una sola vez al repartir el lead (min(candidatas, 5) x 20%)
-- y se guarda aquí para no tener que recalcularlo distinto más tarde a
-- partir de leads_clinica (que solo registra a quién se mandó, no
-- cuántas candidatas había en total).
alter table solicitudes_presupuesto
  add column if not exists match_score_paciente integer;

comment on column solicitudes_presupuesto.match_score_paciente is
  'Cobertura mostrada al paciente: min(candidatas premium que encajaban, 5) x 20. No es la media/mejor de los match_score por clínica.';
