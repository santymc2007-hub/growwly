-- Fechas de activación/expiración por cada tipo de visibilidad, para
-- poder facturar por días activos y para que se desactive solo al
-- cumplirse el plazo. Un único campo JSON (como horarios_estructurados
-- o medicos) en vez de columnas nuevas por cada tipo, para que añadir
-- un tipo de visibilidad futuro no requiera tocar el esquema.
--
-- Forma: { "destacado": { "activado_en": "2026-08-13T10:00:00Z",
--                          "expira_en": "2026-11-13T10:00:00Z" | null },
--          "destacado_home": {...}, "destacado_ciudad": {...},
--          "premium": {...} }
-- expira_en = null significa indefinido (no se autodesactiva).
alter table public.clinics
  add column if not exists visibilidad_fechas jsonb not null default '{}'::jsonb;
