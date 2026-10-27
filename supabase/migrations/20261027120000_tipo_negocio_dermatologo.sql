-- La categoría "Dermatólogo capilar" (PR #249) faltaba en el check de la BD.
alter table public.clinics drop constraint if exists clinics_tipo_negocio_check;
alter table public.clinics add constraint clinics_tipo_negocio_check check (tipo_negocio is null or tipo_negocio = any (array['Hospital con unidad capilar','Clínica de trasplante capilar','Clínica de tricología','Dermatólogo capilar','Clínica estética con unidad capilar','Centro capilar no médico','Micropigmentación capilar']));
