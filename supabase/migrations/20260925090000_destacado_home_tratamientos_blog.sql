alter table public.tratamientos
  add column if not exists destacado_home boolean not null default false;

alter table public.blog_posts
  add column if not exists destacado_home boolean not null default false;

comment on column public.tratamientos.destacado_home is 'Se muestra en el módulo "Tratamientos más demandados" de la home — máximo 4 marcados a la vez (se valida en la Server Action).';
comment on column public.blog_posts.destacado_home is 'Se muestra en el módulo "Del blog" de la home — máximo 4 marcados a la vez (se valida en la Server Action).';
