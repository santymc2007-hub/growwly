-- Sistema de blog: entradas gestionadas desde el panel de admin,
-- visibles públicamente en /blog cuando publicado = true.
create table if not exists public.blog_posts (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  titulo        text not null,
  resumen       text,
  contenido     text not null default '',
  imagen_portada text,
  autor         text not null default 'Growwly',
  publicado     boolean not null default false,
  publicado_en  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.blog_posts is 'Entradas del blog de Growwly';
comment on column public.blog_posts.contenido is 'Cuerpo del artículo en Markdown';
comment on column public.blog_posts.publicado is 'false = borrador (no visible en /blog)';

create index if not exists blog_posts_publicado_idx on public.blog_posts (publicado, publicado_en desc);

alter table public.blog_posts enable row level security;

drop policy if exists "Cualquiera puede ver entradas publicadas" on public.blog_posts;
create policy "Cualquiera puede ver entradas publicadas"
on public.blog_posts
for select
to public
using (publicado = true);

-- Mantener updated_at al día
create or replace function public.set_blog_posts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists blog_posts_set_updated_at on public.blog_posts;
create trigger blog_posts_set_updated_at
before update on public.blog_posts
for each row
execute function public.set_blog_posts_updated_at();

-- Bucket público de Storage para las imágenes de portada del blog.
insert into storage.buckets (id, name, public)
values ('blog-photos', 'blog-photos', true)
on conflict (id) do nothing;

drop policy if exists "Public read access to blog photos" on storage.objects;
create policy "Public read access to blog photos"
on storage.objects
for select
to public
using (bucket_id = 'blog-photos');

drop policy if exists "Authenticated users can upload blog photos" on storage.objects;
create policy "Authenticated users can upload blog photos"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'blog-photos');

drop policy if exists "Authenticated users can update blog photos" on storage.objects;
create policy "Authenticated users can update blog photos"
on storage.objects
for update
to authenticated
using (bucket_id = 'blog-photos');

drop policy if exists "Authenticated users can delete blog photos" on storage.objects;
create policy "Authenticated users can delete blog photos"
on storage.objects
for delete
to authenticated
using (bucket_id = 'blog-photos');
