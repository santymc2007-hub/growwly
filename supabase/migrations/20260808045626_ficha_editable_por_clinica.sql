-- Permite "dar de baja" una ficha sin borrarla (reversible), para que
-- la propia clínica pueda hacerlo desde su panel.
alter table public.clinics
  add column if not exists publicado boolean not null default true;

comment on column public.clinics.publicado is 'Si aparece en el directorio público. false = de baja (dato conservado, reversible)';
