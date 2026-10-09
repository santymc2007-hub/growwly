-- leads_enabled nacía a true para todas las clínicas (el comentario de
-- la columna decía "de momento no bloquea nada en ningún sitio, solo
-- existe el interruptor"). Ahora sí se hace cumplir: el reparto de
-- leads es cosa de plan premium, pero leads_enabled=true sirve de
-- excepción manual para dar acceso de cortesía/prueba a una clínica
-- en plan básico. Para que eso tenga sentido, las básicas existentes
-- tienen que arrancar en false (si no, todas pasarían ya la excepción
-- sin que el admin la haya activado a propósito).
alter table public.clinics
  alter column leads_enabled set default false;

update public.clinics
  set leads_enabled = false
  where plan = 'basico';

comment on column public.clinics.leads_enabled is
  'Excepción manual de cortesía/prueba para dar leads a una clínica en plan básico (que de otro modo no entra en el reparto). Para premium no aporta nada — ya recibe leads por el plan.';
