-- Auditoría de seguridad (oct 2026) — datos privados de clínica fuera
-- de la tabla pública.
--
-- `clinics` es legible por cualquiera con la clave pública (la usan
-- las páginas públicas con select *), así que nada privado puede vivir
-- ahí. Esta tabla guarda lo que solo debe ver el servidor:
--   - datos_facturacion: titular, NIF/CIF, email de facturación
--     (antes en clinics.datos_facturacion, que estaba vacía en todas).
--   - alta_email: email de quien creó la clínica desde /clinica/registro
--     ("mi clínica no está"). Es lo que permite autoaprobar a esa
--     persona — antes se autoaprobaba a cualquiera que abriera
--     /clinica/vincular/<id>?nueva=1.
--
-- Sin políticas RLS a propósito: solo accede el servidor con la clave
-- secreta.

create table if not exists public.clinic_privado (
  clinic_id uuid primary key references public.clinics(id) on delete cascade,
  datos_facturacion jsonb,
  alta_email text,
  updated_at timestamptz not null default now()
);

alter table public.clinic_privado enable row level security;
revoke all on public.clinic_privado from anon, authenticated;

comment on table public.clinic_privado is 'Datos privados de cada clínica (facturación, email de alta). Solo service_role.';
