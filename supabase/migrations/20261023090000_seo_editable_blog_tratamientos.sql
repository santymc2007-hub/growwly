-- Title SEO opcional y slug editable (con historial para redirigir 301)
-- en posts del blog y páginas de tratamiento.
alter table public.blog_posts
  add column if not exists seo_title text,
  add column if not exists slugs_antiguos text[] not null default '{}';

alter table public.tratamientos
  add column if not exists seo_title text,
  add column if not exists slugs_antiguos text[] not null default '{}';

comment on column public.blog_posts.seo_title is 'Title para Google si es distinto del H1. Vacío = se usa el título.';
comment on column public.tratamientos.seo_title is 'Title para Google si es distinto del H1. Vacío = se genera automáticamente.';
comment on column public.blog_posts.slugs_antiguos is 'Slugs anteriores: la URL vieja redirige (301) a la actual.';
comment on column public.tratamientos.slugs_antiguos is 'Slugs anteriores: la URL vieja redirige (301) a la actual.';

create index if not exists blog_posts_slugs_antiguos_idx on public.blog_posts using gin (slugs_antiguos);
create index if not exists tratamientos_slugs_antiguos_idx on public.tratamientos using gin (slugs_antiguos);
