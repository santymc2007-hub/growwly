alter table public.clinics
  add column if not exists verificado_admin boolean not null default true;

comment on column public.clinics.verificado_admin is 'Control exclusivo de admin: si es false, la ficha no se ve en la web pase lo que pase con "publicado" (que la propia clínica puede tocar). Por defecto true para no afectar a las clínicas ya existentes o creadas desde el panel de admin; false solo cuando una clínica se crea a sí misma desde /clinica/registro, hasta que admin verifica su autenticidad.';
