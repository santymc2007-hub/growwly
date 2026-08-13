-- Ampliación del catálogo: de "solo injerto capilar" a las 4 categorías
-- (diagnóstico, tratamientos médicos, injerto, estética capilar).
alter table public.tratamientos
  add column if not exists categoria text;

comment on column public.tratamientos.categoria is 'Una de CATEGORIAS_TRATAMIENTO en clinic-options.ts';

update public.tratamientos set categoria = 'Injerto capilar'
where slug in ('injerto-capilar-fue', 'injerto-capilar-dhi', 'injerto-capilar-fut', 'injerto-sin-afeitado');
update public.tratamientos set categoria = 'Tratamientos médicos'
where slug in ('mesoterapia-capilar', 'prp');
update public.tratamientos set categoria = 'Estética capilar'
where slug = 'micropigmentacion-capilar';

insert into public.tratamientos (slug, nombre, tecnica_relacionada, categoria, resumen, contenido, duracion_orientativa, preguntas_frecuentes) values

('consulta-tricologica', 'Consulta Tricológica', 'Consulta tricológica', 'Diagnóstico y consulta',
'La primera visita para saber qué te está pasando de verdad antes de decidir ningún tratamiento — con o sin cirugía.',
'## Qué es

La consulta tricológica es una visita con un especialista en cuero cabelludo y cabello (tricólogo o dermatólogo capilar) para diagnosticar el tipo de caída, su causa y su fase. No es un paso previo obligatorio a la cirugía — muchas veces es la consulta que evita una cirugía innecesaria, o la que detecta que el problema es tratable sin ella.

## Para quién es

Para cualquiera que note caída de cabello y no sepa por qué — hombre o mujer. Es especialmente útil cuando la caída es difusa (más habitual en mujeres) o de aparición reciente, casos donde el "qué hacer" no es tan evidente como en una entrada clásica masculina.

## Cómo es el proceso

- Historial médico y familiar.
- Examen del cuero cabelludo (a menudo con tricoscopia, una cámara de aumento).
- A veces se deriva a análisis clínico o biopsia si se sospecha una causa no hormonal.
- Diagnóstico y, si procede, plan de tratamiento — que puede incluir o no cirugía.

## Qué esperar después

Un diagnóstico claro (androgenética, difusa, areata, telógena, etc.) y una recomendación de siguiente paso, ajustada a tu caso concreto.',
'30-45 minutos',
'[{"pregunta": "¿Necesito pasar por aquí antes de un injerto?", "respuesta": "No es obligatorio, pero es lo más recomendable — confirma que el injerto es de verdad la solución adecuada para tu tipo de caída."}, {"pregunta": "¿Sirve para mujeres?", "respuesta": "Sí, de hecho es el punto de entrada más útil para caída femenina, donde el diagnóstico es menos evidente a simple vista que en la masculina."}]'::jsonb),

('analitica-capilar', 'Analítica Capilar', 'Analítica capilar', 'Diagnóstico y consulta',
'Pruebas de sangre y/o de cuero cabelludo para encontrar la causa real de la caída — hormonal, nutricional o de otro tipo.',
'## Qué es

Un conjunto de pruebas (analítica de sangre, y a veces tricograma o biopsia) para identificar la causa de la caída de cabello cuando no es evidente. Se usa junto a la consulta tricológica, no en su lugar.

## Para quién es

Especialmente indicada cuando la caída es reciente, difusa, o no encaja con el patrón hereditario típico — casos donde puede haber una causa tratable de fondo (tiroides, hierro, déficits nutricionales, cambios hormonales).

## Cómo es el proceso

- Extracción de sangre en la propia clínica o en un laboratorio asociado.
- Parámetros habituales: hierro/ferritina, tiroides, vitamina D, zinc, hormonas.
- En algunos casos, tricograma (análisis microscópico de los folículos).

## Qué esperar después

Resultados en unos días, revisados junto al especialista, que ajustará el tratamiento si la causa es corregible sin necesidad de intervención.',
'Prueba en clínica; resultados en 3-7 días',
'[]'::jsonb),

('minoxidil', 'Minoxidil', 'Minoxidil', 'Tratamientos médicos',
'Tratamiento tópico de uso diario, el más extendido y estudiado para frenar la caída y estimular el crecimiento.',
'## Qué es

El minoxidil es una solución o espuma que se aplica directamente sobre el cuero cabelludo. Es uno de los tratamientos con más respaldo de estudios clínicos, tanto para alopecia androgenética masculina como femenina.

## Para quién es

Para hombres y mujeres en fases iniciales o moderadas de caída, como tratamiento único o combinado con otros (mesoterapia, PRP, o como mantenimiento tras un injerto).

## Cómo es el proceso

- Aplicación diaria (normalmente 1-2 veces al día) directamente en el cuero cabelludo.
- Es un tratamiento de mantenimiento continuo — los resultados se mantienen mientras se sigue usando.
- Los primeros efectos suelen tardar varios meses en notarse.

## Qué tener en cuenta

Como cualquier tratamiento médico, conviene usarlo bajo supervisión de un profesional, que valorará la dosis y descartará contraindicaciones. No es una decisión que deba tomarse solo por lo que se lea en una ficha como esta.',
'Uso diario y continuado',
'[{"pregunta": "¿Deja de hacer efecto si lo dejo?", "respuesta": "El beneficio se mantiene mientras se usa; al suspenderlo, la caída suele volver a su curso natural con el tiempo."}]'::jsonb),

('finasteride-dutasteride', 'Finasteride / Dutasteride', 'Finasteride / Dutasteride', 'Tratamientos médicos',
'Tratamiento oral con receta, el más recetado a nivel mundial para frenar la caída androgenética en hombres.',
'## Qué es

Finasteride y dutasteride son medicamentos orales que actúan sobre la hormona (DHT) responsable de la miniaturización folicular en la alopecia androgenética. Requieren receta médica y seguimiento profesional.

## Para quién es

Principalmente indicado en hombres con alopecia androgenética. Su uso en mujeres es mucho más limitado y siempre bajo criterio médico específico, dado el mecanismo hormonal del fármaco.

## Cómo es el proceso

- Prescripción tras valoración médica (nunca autoprescripción).
- Toma oral diaria.
- Revisiones periódicas para valorar respuesta y efectos.

## Qué tener en cuenta

Es un tratamiento médico con posibles efectos secundarios que debe valorar y supervisar un profesional — esta ficha es solo informativa, no sustituye una consulta real.',
'Uso diario y continuado, bajo prescripción',
'[]'::jsonb),

('laser-baja-intensidad', 'Láser de Baja Intensidad', 'Láser de baja intensidad', 'Tratamientos médicos',
'Terapia de luz de bajo nivel (LLLT) para estimular el folículo, sin fármacos ni cirugía.',
'## Qué es

La terapia láser de baja intensidad (LLLT) usa luz roja de bajo nivel para estimular la actividad folicular. Se aplica en cabina (casco o peine láser en clínica) o, en algunos casos, con dispositivos de uso doméstico prescritos por la clínica.

## Para quién es

Como complemento a otros tratamientos (minoxidil, mesoterapia) o para quienes buscan una opción no farmacológica en fases iniciales de caída.

## Cómo es el proceso

- Sesiones periódicas en clínica (o uso pautado en casa con el dispositivo adecuado).
- Sin dolor ni tiempo de recuperación.
- Se valora normalmente como tratamiento de varios meses.

## Qué esperar después

Resultados progresivos y modestos comparados con tratamientos médicos u cirugía — suele plantearse como complemento, no como solución única.',
'Sesiones periódicas, varios meses',
'[]'::jsonb),

('injerto-de-barba', 'Injerto de Barba', 'Injerto de barba', 'Injerto capilar',
'Trasplante de folículos de la zona donante a la barba, para densidad, forma o cubrir cicatrices.',
'## Qué es

El injerto de barba traslada folículos (normalmente de la nuca) a las zonas de la barba con poca densidad, usando la misma técnica FUE que en el cuero cabelludo. Es la categoría de injerto "no cuero cabelludo" más habitual entre hombres.

## Para quién es

Hombres con barba irregular, poco poblada, o con cicatrices o zonas sin vello que quieran cubrir. También se usa para definir mejor la línea y forma de la barba.

## Cómo es el proceso

- Diseño de la forma deseada junto al especialista.
- Extracción de folículos de la zona donante.
- Implantación folículo a folículo respetando la dirección natural del vello facial.
- Sin hospitalización, con anestesia local.

## Qué esperar después

El pelo trasplantado cae en las primeras semanas (normal) y vuelve a crecer de forma definitiva a partir de los 3-4 meses, con resultado consolidado sobre los 8-12 meses.',
'Media jornada; resultado final en 8-12 meses',
'[]'::jsonb),

('injerto-de-cejas', 'Injerto de Cejas', 'Injerto de cejas', 'Injerto capilar',
'Trasplante capilar para densidad, forma o reconstrucción de cejas.',
'## Qué es

El injerto de cejas traslada folículos a la zona de las cejas para aumentar densidad, corregir asimetrías o reconstruir cejas con poco o ningún vello (por depilación excesiva, alopecia o cicatrices).

## Para quién es

Es la técnica de injerto no quirúrgico más solicitada entre mujeres después del propio cuero cabelludo, según los datos del sector — junto a hombres que buscan cejas más definidas o corregir asimetrías.

## Cómo es el proceso

- Diseño personalizado de la forma, adaptado a la cara.
- Extracción e implantación folículo a folículo con un ángulo muy preciso (el vello de ceja crece en una dirección muy concreta).
- Procedimiento ambulatorio con anestesia local.

## Qué esperar después

Igual que en barba: caída inicial normal del pelo implantado, crecimiento definitivo a partir de los 3-4 meses.',
'2-4 horas; resultado final en 8-12 meses',
'[]'::jsonb),

('extensiones-de-cabello', 'Extensiones de Cabello', 'Extensiones de cabello', 'Estética capilar',
'Solución inmediata (no quirúrgica) para ganar densidad o longitud sin esperar a que crezca el propio cabello.',
'## Qué es

Las extensiones capilares añaden mechones de cabello natural o sintético al propio cabello, mediante distintas técnicas de fijación (queratina, microanillas, cosido, clip). A diferencia del injerto, no es una solución permanente ni médica — es estética y reversible.

## Para quién es

Para quienes buscan un resultado inmediato de densidad o longitud, ya sea de forma puntual o como solución mientras se valoran otras opciones a más largo plazo.

## Cómo es el proceso

- Selección de técnica según el tipo de cabello y resultado buscado.
- Colocación mechón a mechón (varias horas según la técnica y cantidad).
- Requiere mantenimiento periódico y retirada/renovación cada cierto tiempo.

## Qué tener en cuenta

No trata la causa de la caída, solo su apariencia — conviene combinarlo con un diagnóstico si la caída es progresiva.',
'2-6 horas según técnica',
'[]'::jsonb),

('pelucas-protesis-capilares', 'Pelucas y Prótesis Capilares', 'Pelucas y prótesis capilares', 'Estética capilar',
'Soluciones no quirúrgicas para cobertura total o parcial — desde causas oncológicas hasta alopecia areata o androgenética avanzada.',
'## Qué es

Las pelucas y prótesis capilares (también llamadas sistemas de cabello) son soluciones que cubren total o parcialmente el cuero cabelludo con cabello natural o sintético, con distintos niveles de personalización y fijación (desde pelucas convencionales hasta prótesis adheridas de uso continuado).

## Para quién es

Es una categoría con mucha carga emocional y a menudo poco visible en directorios de clínicas: personas en tratamiento oncológico, alopecia areata total o universal, o alopecia androgenética muy avanzada donde el injerto ya no es una opción realista.

## Cómo es el proceso

- Valoración y medición personalizada.
- Elección de material (cabello natural o sintético) y sistema de fijación.
- Ajuste y, si procede, corte/peinado a medida.

## Qué esperar después

Un resultado inmediato, sin cirugía ni tiempo de recuperación — con mantenimiento periódico según el tipo de sistema elegido.',
'Cita de medición + entrega, según clínica',
'[]'::jsonb);
