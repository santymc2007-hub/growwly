-- Perfiles de usuario (pacientes que se registran en Growwly).
-- Separado de auth.users para poder guardar datos propios (nombre,
-- teléfono...) y un rol que distinga pacientes de administradores.
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  nombre      text,
  apellidos   text,
  telefono    text,
  edad        integer,
  role        text not null default 'patient',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'Perfil de cada usuario registrado (pacientes y administradores)';
comment on column public.profiles.role is '''patient'' o ''admin''';

alter table public.profiles enable row level security;

drop policy if exists "Los usuarios ven su propio perfil" on public.profiles;
create policy "Los usuarios ven su propio perfil"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Los usuarios editan su propio perfil" on public.profiles;
create policy "Los usuarios editan su propio perfil"
on public.profiles
for update
to authenticated
using (auth.uid() = id);

-- Mantener updated_at al día
create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_profiles_updated_at();

-- Crear el perfil automáticamente al registrarse, usando los datos
-- adicionales (nombre, apellidos, teléfono, edad) que se manden como
-- metadata en el signUp. Rol por defecto: 'patient'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, nombre, apellidos, telefono, edad, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'nombre',
    new.raw_user_meta_data ->> 'apellidos',
    new.raw_user_meta_data ->> 'telefono',
    nullif(new.raw_user_meta_data ->> 'edad', '')::integer,
    'patient'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();
