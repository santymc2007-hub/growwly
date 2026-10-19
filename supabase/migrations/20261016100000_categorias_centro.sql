-- Nuevas categorías de centro (de más médica a menos), sustituyen a las
-- 7 antiguas. Reasignación ficha a ficha según su actividad principal.

update public.clinics set tipo_negocio = 'Hospital con unidad capilar'
where slug in ('unidad-de-tricologia-y-trasplante-capilar-clinica-rotger');

update public.clinics set tipo_negocio = 'Clínica de trasplante capilar'
where slug in (
  'clinica-capilar-nadal', 'mas-pelo-clinica-capila', 'medical-hair-mallorca',
  'palma-capilar', 'dra-stefany-mendoza-icas', 'asensi-hair-clinic',
  'oliva-aesthetic-hair-clinic', 'svenson-clinica-capilar'
);

update public.clinics set tipo_negocio = 'Clínica de tricología'
where slug in ('tricologia-mir', 'imd-clinica-capilar');

update public.clinics set tipo_negocio = 'Clínica estética con unidad capilar'
where slug in (
  'biutibox-palma', 'censalud-palma', 'clinica-conde', 'clinica-estetica-el-zielo-palma',
  'clinica-elite-palma', 'clinica-estetica-manacor', 'clinica-mesomedic-manacor',
  'clinica-mesomedic-palma', 'eon-clinic-calvia', 'imar-medicina-avanzada',
  'instituto-balear-de-medicina-estetica-ibame', 'mallorca-aesthetic-clinic',
  'medisans', 'saz-clinica-estetica', 'soma-clinic', 'cmc-vitaclinic'
);

update public.clinics set tipo_negocio = 'Centro capilar no médico'
where slug in ('pelosystems');

-- Cualquier valor antiguo que quede (fichas creadas entre medias) pasa a
-- su equivalente más prudente.
update public.clinics set tipo_negocio = case tipo_negocio
  when 'Centro de injertos capilares' then 'Clínica de trasplante capilar'
  when 'Clínica capilar' then 'Clínica de trasplante capilar'
  when 'Clínica estética' then 'Clínica estética con unidad capilar'
  when 'Clínica médica / hospital' then 'Hospital con unidad capilar'
  when 'Peluquería / centro de belleza con servicios capilares' then 'Centro capilar no médico'
  else null end
where tipo_negocio is not null and tipo_negocio not in (
  'Hospital con unidad capilar', 'Clínica de trasplante capilar', 'Clínica de tricología',
  'Clínica estética con unidad capilar', 'Centro capilar no médico', 'Micropigmentación capilar'
);

alter table public.clinics drop constraint if exists clinics_tipo_negocio_check;
alter table public.clinics add constraint clinics_tipo_negocio_check check (
  tipo_negocio is null or tipo_negocio in (
    'Hospital con unidad capilar', 'Clínica de trasplante capilar', 'Clínica de tricología',
    'Clínica estética con unidad capilar', 'Centro capilar no médico', 'Micropigmentación capilar'
  )
);

comment on column public.clinics.tipo_negocio is
  'Categoría principal del centro (selección única). Valores en CATEGORIAS_CENTRO (src/lib/clinic-options.ts).';
