-- Tipo de dispositivo en cada paso del embudo, reducido a una categoría
-- (movil, escritorio, app_instagram, app_facebook). Nunca se guarda el
-- user-agent ni nada que identifique a la persona. Sirve para ver si un
-- paso falla en el navegador interno de Instagram/Facebook (anuncios de
-- Meta) o en escritorio.
alter table public.embudo_eventos add column if not exists dispositivo text;

alter table public.embudo_eventos drop constraint if exists embudo_eventos_dispositivo_largo;
alter table public.embudo_eventos
  add constraint embudo_eventos_dispositivo_largo check (dispositivo is null or char_length(dispositivo) <= 20);
