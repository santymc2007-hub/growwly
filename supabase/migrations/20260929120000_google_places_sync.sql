-- Datos para sincronizar ubicación, rating y reseñas reales desde
-- Google Places API (New). rating_google, resenas_google, lat y lng ya
-- existían (pensados para esto); aquí solo se añade el identificador
-- del sitio en Google Maps, las reseñas concretas (para schema.org
-- Review en la ficha pública) y cuándo se sincronizó por última vez.
alter table clinics
  add column if not exists google_place_id text,
  add column if not exists google_reviews jsonb not null default '[]'::jsonb,
  add column if not exists google_synced_at timestamptz;

create unique index if not exists clinics_google_place_id_idx
  on clinics (google_place_id)
  where google_place_id is not null;
