-- Slug editable, meta title y meta description propios en tratamientos y blog.
-- slugs_anteriores guarda los slugs viejos para redirigir (301) si se cambia.
alter table public.tratamientos
  add column if not exists meta_title text,
  add column if not exists meta_description text,
  add column if not exists slugs_anteriores text[] not null default '{}';
alter table public.blog_posts
  add column if not exists meta_title text,
  add column if not exists meta_description text,
  add column if not exists slugs_anteriores text[] not null default '{}';
create index if not exists tratamientos_slugs_anteriores_idx on public.tratamientos using gin (slugs_anteriores);
create index if not exists blog_posts_slugs_anteriores_idx on public.blog_posts using gin (slugs_anteriores);
