-- Auditoría de seguridad (oct 2026) — aviso "Function Search Path
-- Mutable" de Supabase Advisors. Estas funciones solo hacen
-- new.updated_at = now(); now() vive en pg_catalog, que siempre está.
alter function public.set_updated_at() set search_path = '';
alter function public.set_profiles_updated_at() set search_path = '';
alter function public.set_blog_posts_updated_at() set search_path = '';
alter function public.set_tratamientos_updated_at() set search_path = '';
