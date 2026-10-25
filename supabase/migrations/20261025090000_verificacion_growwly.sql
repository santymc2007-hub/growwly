alter table public.clinics
  add column if not exists medico_responsable text,
  add column if not exists colegiado_responsable text,
  add column if not exists verif_registro boolean not null default false,
  add column if not exists verif_colegiado boolean not null default false,
  add column if not exists verif_contacto boolean not null default false,
  add column if not exists verificado_en timestamptz;
