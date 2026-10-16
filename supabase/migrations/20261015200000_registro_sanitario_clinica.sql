-- Número de registro sanitario del centro (autorización de la comunidad
-- autónoma, p. ej. el registro de centros sanitarios de las Illes
-- Balears). Es información pública y se muestra en la ficha: la
-- publicidad de un centro sanitario debe identificarlo. Ya aplicado en
-- Supabase.
alter table public.clinics add column if not exists registro_sanitario text;
comment on column public.clinics.registro_sanitario is 'Número de autorización/registro sanitario del centro (registro de centros sanitarios de la comunidad autónoma). Público: se muestra en la ficha.';
