-- 26 oct 2026 (decisión de Santy): indicador de evidencia científica en
-- las fichas de tratamiento y tres altas/cambios en el catálogo.

-- 1. Evidencia científica por tratamiento. Solo se muestra en público
-- cuando evidencia_revisada = true (la revisa una persona con criterio
-- médico antes de publicarla).
alter table public.tratamientos
  add column if not exists evidencia text
    check (evidencia in ('alta', 'moderada', 'preliminar', 'insuficiente')),
  add column if not exists evidencia_texto text,
  add column if not exists evidencia_fuentes jsonb not null default '[]'::jsonb,
  add column if not exists evidencia_revisada boolean not null default false,
  add column if not exists evidencia_actualizada date;

comment on column public.tratamientos.evidencia is 'Nivel de evidencia frente a la alopecia: alta | moderada | preliminar | insuficiente. Null = no aplica (cirugía, diagnóstico, estética).';
comment on column public.tratamientos.evidencia_fuentes is 'Array de {titulo, url}: estudios o guías que respaldan el nivel.';
comment on column public.tratamientos.evidencia_revisada is 'Solo con true se enseña en la web.';

-- 2. "Láser de baja intensidad" pasa a incluir el LED (cromotecnia,
-- fotobiomodulación).
update public.clinics
  set tecnicas = array_replace(tecnicas, 'Láser de baja intensidad', 'Láser y LED de baja intensidad')
  where 'Láser de baja intensidad' = any(tecnicas);
update public.tratamientos
  set tecnica_relacionada = 'Láser y LED de baja intensidad',
      nombre = 'Láser y LED de baja intensidad'
  where tecnica_relacionada = 'Láser de baja intensidad';
