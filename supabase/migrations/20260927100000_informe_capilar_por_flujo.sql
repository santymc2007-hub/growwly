-- Informe capilar por flujo (7 tipos de informe).
-- Añade a cada estudio el flujo detectado por la IA y los datos
-- estructurados del informe (grado, zonas del mapa, lo que se ve en las
-- fotos, ángulo y calidad de cada foto). Los estudios antiguos se quedan
-- con estas columnas a null y se siguen mostrando con la vista anterior.

alter table public.estudios_capilares
  add column if not exists flujo text,
  add column if not exists informe jsonb;

alter table public.estudios_capilares
  drop constraint if exists estudios_capilares_flujo_check;

alter table public.estudios_capilares
  add constraint estudios_capilares_flujo_check check (
    flujo is null or flujo in (
      'alopecia_androgenetica_masculina',
      'alopecia_androgenetica_femenina',
      'efluvio_telogeno',
      'alopecia_areata',
      'alopecia_por_traccion',
      'cuero_cabelludo',
      'sin_signos'
    )
  );
