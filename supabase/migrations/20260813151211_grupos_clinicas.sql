-- Base para grupos de clínicas: una cuenta (profile) puede gestionar
-- varias clínicas, no solo una. profiles.clinic_id se mantiene tal
-- cual (compatibilidad, y como referencia de "cuál fue la primera"),
-- pero a partir de ahora el acceso real se resuelve por esta tabla.
create table if not exists public.clinic_members (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (profile_id, clinic_id)
);

create index if not exists clinic_members_profile_idx on public.clinic_members(profile_id);
create index if not exists clinic_members_clinic_idx on public.clinic_members(clinic_id);

alter table public.clinic_members enable row level security;

-- Cada cuenta solo puede ver sus propias filas; las escrituras las hace
-- siempre el cliente admin del servidor (misma política que el resto
-- de tablas de este proyecto).
create policy "clinic_members_select_own" on public.clinic_members
  for select using (profile_id = auth.uid());

-- Migrar las cuentas de clínica ya existentes a la nueva tabla, para
-- que nadie pierda acceso a su ficha con este cambio.
insert into public.clinic_members (profile_id, clinic_id)
select id, clinic_id from public.profiles
where role = 'clinic' and clinic_id is not null
on conflict (profile_id, clinic_id) do nothing;
