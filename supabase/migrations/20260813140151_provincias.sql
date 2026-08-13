-- Base para expansión nacional: cada clínica pertenece a una provincia.
-- El campo "provincia" ya existía (nullable, sin usar — de una versión
-- inicial pensada para toda España). Rellenamos los nulos actuales
-- (todas las clínicas de hoy son de Mallorca) y lo hacemos obligatorio.
update public.clinics set provincia = 'Illes Balears' where provincia is null;

alter table public.clinics
  alter column provincia set not null,
  alter column provincia set default 'Illes Balears';

create index if not exists clinics_provincia_idx on public.clinics (provincia);
