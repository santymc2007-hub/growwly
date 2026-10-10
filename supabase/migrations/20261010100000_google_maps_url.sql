-- URL real de Google Maps (googleMapsUri de Places API) — hasta ahora
-- se pedía a la API pero no se guardaba en ningún sitio. Sirve para
-- enlazar "Ver en Google Maps" con la ficha exacta (alineado a nivel
-- de SEO local) en vez de un enlace de búsqueda genérico por nombre.
alter table public.clinics
  add column if not exists google_maps_url text;
