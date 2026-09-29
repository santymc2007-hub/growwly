-- Faltaban índices en columnas que se filtran constantemente (el
-- listado de "mis análisis"/"mis presupuestos" de cada paciente, y el
-- listado de leads de cada clínica). Con pocas filas no se nota, pero
-- sin esto cada una de esas consultas es un recorrido completo de la
-- tabla en vez de una búsqueda directa por índice — empeora según
-- crecen los datos.
create index if not exists leads_clinica_clinic_id_idx
  on leads_clinica (clinic_id);

create index if not exists solicitudes_presupuesto_user_id_idx
  on solicitudes_presupuesto (user_id);

create index if not exists estudios_capilares_user_id_idx
  on estudios_capilares (user_id);
