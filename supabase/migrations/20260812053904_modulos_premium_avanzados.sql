-- Módulos grandes pendientes de la especificación de planes:
-- leads como add-on independiente (construido pero SIN bloquear a nadie
-- por defecto — true preserva el comportamiento actual para todas las
-- clínicas ya existentes), perfiles médicos, vídeo y descripción
-- extendida (contenido premium, mismo patrón de "guardado en borrador").
alter table public.clinics
  add column if not exists leads_enabled boolean not null default true,
  add column if not exists medicos jsonb not null default '[]'::jsonb,
  add column if not exists video_url text,
  add column if not exists descripcion_extendida text;

comment on column public.clinics.leads_enabled is 'Add-on independiente del plan — de momento no se hace cumplir en ningún sitio, solo existe el interruptor';
comment on column public.clinics.medicos is 'Array de {nombre, especialidad, foto_url} — contenido premium';
comment on column public.clinics.video_url is 'URL de YouTube/Vimeo — contenido premium';
comment on column public.clinics.descripcion_extendida is 'Markdown — contenido premium, complementa (no sustituye) la descripción corta';
