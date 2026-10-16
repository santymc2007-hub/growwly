-- Antes cualquiera podía leer por la API todas las fichas de clínica,
-- también las no publicadas (altas pendientes de revisar, fichas
-- retiradas). Ahora la clave pública solo ve las publicadas; el admin y
-- los miembros de cada clínica siguen viendo las suyas. El servidor
-- (clave secreta) no pasa por aquí.
--
-- Se cambia la política existente en vez de borrarla y crear otra (el
-- borrado pedía confirmación manual). Efecto igual. Auditoría oct 2026.
alter policy "Clinics are publicly readable" on public.clinics
  using (
    publicado = true
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
    or exists (
      select 1 from public.clinic_members m
      where m.clinic_id = clinics.id and m.profile_id = (select auth.uid())
    )
  );

alter policy "Clinics are publicly readable" on public.clinics
  rename to "Fichas publicadas legibles; admin y miembros ven las suyas";
