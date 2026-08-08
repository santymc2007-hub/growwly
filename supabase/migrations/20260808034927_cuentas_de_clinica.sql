-- Cuentas de clínica: un perfil con role='clinic' se vincula a una
-- fila de clinics. Queda 'pendiente' hasta que el admin lo aprueba,
-- para que nadie pueda reclamar una clínica ajena sin control.
alter table public.profiles
  add column if not exists clinic_id uuid references public.clinics (id) on delete set null,
  add column if not exists clinic_status text;

comment on column public.profiles.clinic_id is 'Solo para role=clinic: a qué clínica del directorio representa';
comment on column public.profiles.clinic_status is 'Solo para role=clinic: pendiente | aprobado';

create index if not exists profiles_clinic_id_idx on public.profiles (clinic_id);

-- El trigger de alta (creado en la migración de profiles) siempre ponía
-- role='patient' a la fuerza. Ahora respeta el rol que venga en la
-- metadata del signUp (para poder registrar cuentas de clínica).
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
    coalesce(new.raw_user_meta_data ->> 'role', 'patient')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Las clínicas ven sus propios leads (antes solo se veían por token de
-- email; ahora también desde su panel si tienen cuenta aprobada).
drop policy if exists "Las clinicas ven sus propios leads" on public.leads_clinica;
create policy "Las clinicas ven sus propios leads"
on public.leads_clinica
for select
to authenticated
using (
  clinic_id in (
    select clinic_id from public.profiles
    where id = auth.uid() and role = 'clinic' and clinic_status = 'aprobado'
  )
);
