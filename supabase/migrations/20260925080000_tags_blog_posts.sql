-- Sistema de etiquetas para el blog: para poder filtrar/buscar por
-- etiqueta en /blog y mostrarlas en el sidebar de cada post.
alter table public.blog_posts
  add column if not exists tags text[] not null default '{}'::text[];

comment on column public.blog_posts.tags is 'Etiquetas libres del post (ej: minoxidil, fue, alopecia) — se editan como texto separado por comas en el admin.';
