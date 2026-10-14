-- Auditoría de seguridad/RGPD (oct 2026) — análisis capilar.
--
-- consentimiento_en: cuándo dio el usuario el consentimiento explícito
--   (fotos = datos de salud, art. 9 RGPD) antes de subir sus fotos.
--   El RGPD exige poder demostrarlo.
-- ip_hash: huella (SHA-256 con sal) de la IP que creó el estudio, solo
--   para limitar cuántos análisis se lanzan por hora — cada uno cuesta
--   una llamada a la API de IA y antes no había ningún límite. No se
--   guarda la IP en claro.
alter table public.estudios_capilares
  add column if not exists consentimiento_en timestamptz,
  add column if not exists ip_hash text;

create index if not exists estudios_capilares_ip_hash_created_idx
  on public.estudios_capilares (ip_hash, created_at desc);

create index if not exists estudios_capilares_created_idx
  on public.estudios_capilares (created_at desc);
