-- Silo de contenido "Tratamientos" (pilar por técnica) que pide el
-- brief para SEO. Gestionado desde el panel de admin, igual que el
-- blog. Precios orientativos NO se guardan aquí como texto fijo: se
-- calculan en la propia página a partir de los datos reales de las
-- clínicas que ofrecen cada técnica.
create table if not exists public.tratamientos (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text unique not null,
  nombre                text not null,
  tecnica_relacionada   text,
  resumen               text,
  contenido             text not null default '',
  duracion_orientativa  text,
  preguntas_frecuentes  jsonb not null default '[]'::jsonb,
  imagen_portada        text,
  publicado             boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.tratamientos is 'Páginas pilar por técnica/tratamiento capilar (SEO)';
comment on column public.tratamientos.contenido is 'Cuerpo del artículo en Markdown';
comment on column public.tratamientos.tecnica_relacionada is 'Debe coincidir EXACTO con un valor de TECNICAS_DISPONIBLES (clinics.tecnicas), para poder cruzar con clínicas reales que la ofrecen';
comment on column public.tratamientos.preguntas_frecuentes is 'Array de {pregunta, respuesta} para la sección FAQ y el schema FAQPage';

create index if not exists tratamientos_publicado_idx on public.tratamientos (publicado);

alter table public.tratamientos enable row level security;

drop policy if exists "Cualquiera puede ver tratamientos publicados" on public.tratamientos;
create policy "Cualquiera puede ver tratamientos publicados"
on public.tratamientos
for select
to public
using (publicado = true);

create or replace function public.set_tratamientos_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tratamientos_set_updated_at on public.tratamientos;
create trigger tratamientos_set_updated_at
before update on public.tratamientos
for each row
execute function public.set_tratamientos_updated_at();

-- Contenido inicial: las 7 técnicas ya usadas en el resto de la web
-- (mismo texto exacto que en TECNICAS_DISPONIBLES, para poder cruzar
-- cada página con las clínicas que la ofrecen).
insert into public.tratamientos (slug, nombre, tecnica_relacionada, resumen, contenido, duracion_orientativa, preguntas_frecuentes) values

('injerto-capilar-fue', 'Injerto Capilar FUE', 'Injerto FUE',
'Extracción de folículos uno a uno con micropunch, sin cicatriz lineal. La técnica de trasplante capilar más habitual hoy en día.',
'## Qué es

El injerto capilar FUE (Follicular Unit Extraction) consiste en extraer los folículos pilosos de la zona donante (normalmente la nuca y los laterales de la cabeza, donde el cabello es genéticamente resistente a la caída) uno por uno, con un instrumento llamado micropunch. Después, esos folículos se implantan en la zona con menos densidad.

## Para quién es

Es la técnica más versátil: sirve tanto para entradas y coronilla como para reconstruir la línea frontal, y también se usa en injertos de barba y cejas. Al no requerir una incisión larga, es la opción preferida por quienes quieren evitar una cicatriz lineal visible.

## Cómo es el proceso

- Se rapa (o se deja más largo, en la variante sin afeitado) la zona donante.
- Extracción folículo a folículo con anestesia local.
- Se preparan los injertos y se implantan siguiendo la dirección natural del cabello.
- El propio paciente suele volver a casa el mismo día.

## Recuperación orientativa

Las costras iniciales suelen desprenderse en 7-10 días. El cabello trasplantado se cae en las primeras semanas (algo normal, llamado efluvio) y empieza a crecer de nuevo a partir del tercer o cuarto mes, con resultado visible completo entre los 9 y 12 meses.',
'4-8 horas, en 1 sesión',
'[{"pregunta":"¿Deja cicatriz?","respuesta":"Solo puntos diminutos e imperceptibles en la zona donante, a diferencia de la técnica FUT."},{"pregunta":"¿Cuántas sesiones hacen falta?","respuesta":"La mayoría de los casos se resuelven en una sola sesión; casos de mucha superficie a cubrir pueden requerir una segunda sesión más adelante."},{"pregunta":"¿Duele?","respuesta":"Se realiza con anestesia local; durante el postoperatorio inmediato puede haber molestias leves, controlables con analgésicos habituales."}]'::jsonb),

('injerto-capilar-dhi', 'Injerto Capilar DHI', 'Injerto DHI',
'Variante de FUE que implanta cada folículo directamente con un instrumento tipo pluma, sin abrir canales antes.',
'## Qué es

El DHI (Direct Hair Implantation) es una variante del injerto FUE en la que, en vez de abrir primero los canales receptores y luego insertar los folículos, se usa un instrumento con forma de pluma (llamado implantador) que extrae y coloca cada folículo directamente, en un solo paso.

## Para quién es

Al permitir un control más preciso del ángulo, la dirección y la profundidad de cada folículo, suele recomendarse para zonas donde el resultado estético fino importa especialmente, como la línea frontal del cabello.

## Cómo es el proceso

- Extracción de los folículos de la zona donante, igual que en FUE.
- Cada folículo se carga en el implantador y se coloca directamente en la zona receptora, sin necesidad de abrir el canal de antemano.
- Suele permitir trabajar con el cabello algo más largo en la zona donante.

## Recuperación orientativa

Similar al FUE convencional: costras en 7-10 días, caída inicial del cabello trasplantado (efluvio) en las primeras semanas, y crecimiento progresivo a partir del tercer-cuarto mes.',
'4-8 horas, en 1 sesión',
'[{"pregunta":"¿DHI es mejor que FUE?","respuesta":"No es mejor en términos absolutos; es una técnica distinta con ventajas en precisión de ángulo y densidad, aunque suele requerir más tiempo de intervención por injerto."},{"pregunta":"¿Es más caro que el FUE?","respuesta":"Suele tener un coste algo mayor, dado que exige más tiempo del equipo médico por el proceso de implantación directa folículo a folículo."}]'::jsonb),

('injerto-capilar-fut', 'Injerto Capilar FUT', 'Injerto FUT',
'Extracción de una tira de piel de la zona donante. Permite mover más injertos por sesión, pero deja una cicatriz lineal.',
'## Qué es

El FUT (Follicular Unit Transplantation), también llamado técnica de la tira, consiste en extraer una franja de piel con folículos de la parte posterior de la cabeza. Esa tira se divide después en unidades foliculares individuales bajo microscopio, que se implantan en la zona receptora.

## Para quién es

Suele plantearse en casos que requieren un número muy alto de injertos en una sola sesión, ya que permite extraer más unidades foliculares de una vez que el FUE. Es una técnica a valorar con el especialista, sobre todo si al paciente le preocupa llevar el pelo muy corto en la nuca.

## Cómo es el proceso

- Extracción de una tira de piel de la zona donante, con anestesia local.
- Cierre de la incisión con sutura.
- División de la tira en unidades foliculares individuales.
- Implantación en la zona receptora.

## Recuperación orientativa

La cicatriz lineal en la zona donante queda cubierta por el cabello circundante en la mayoría de los casos. El proceso de caída y crecimiento del cabello trasplantado sigue un calendario similar al del FUE: varias semanas de efluvio inicial y crecimiento visible a partir del tercer-cuarto mes.',
'4-8 horas, en 1 sesión',
'[{"pregunta":"¿Se nota la cicatriz?","respuesta":"Queda como una línea fina que el propio cabello de alrededor suele tapar, aunque puede ser visible con el pelo muy corto."},{"pregunta":"¿Por qué elegir FUT en vez de FUE?","respuesta":"Principalmente cuando se necesita un número elevado de injertos en una única sesión."}]'::jsonb),

('injerto-sin-afeitado', 'Injerto Capilar sin Afeitado', 'Injerto sin afeitado',
'Variante de FUE que no requiere rapar la zona donante, para quien no puede o no quiere llevar el pelo muy corto tras la intervención.',
'## Qué es

También conocida como Long Hair FUE, es una variante de la técnica FUE en la que la zona donante no se rapa por completo: se recorta solo el cabello justo alrededor de cada folículo que se va a extraer, mientras que el resto se mantiene largo.

## Para quién es

Está pensada para personas que, por motivos personales o laborales, no pueden permitirse llevar el pelo muy corto durante las semanas posteriores a la intervención, y prefieren que la recuperación pase más desapercibida.

## Cómo es el proceso

- Se identifican y recortan solo los folículos concretos que se van a extraer, dejando el resto de la zona donante con su longitud habitual.
- El resto del proceso (extracción e implantación) es equivalente al FUE convencional.

## Recuperación orientativa

Al mantenerse la mayor parte del cabello de alrededor sin rapar, la zona donante disimula mejor la intervención recién hecha. El calendario de caída y crecimiento del cabello trasplantado es el mismo que en el FUE estándar.',
'4-8 horas, en 1 sesión',
'[{"pregunta":"¿Es una técnica distinta al FUE?","respuesta":"Es el mismo método de extracción folículo a folículo, con la única diferencia de que no se rapa toda la zona donante."},{"pregunta":"¿Tiene algún inconveniente?","respuesta":"El proceso de extracción puede ser algo más laborioso y lento para el equipo médico, al trabajar entre cabello más largo."}]'::jsonb),

('mesoterapia-capilar', 'Mesoterapia Capilar', 'Mesoterapia capilar',
'Microinyecciones de vitaminas y principios activos en el cuero cabelludo para fortalecer el cabello existente, sin cirugía.',
'## Qué es

La mesoterapia capilar consiste en microinyecciones superficiales de un cóctel de vitaminas, minerales y principios activos directamente en el cuero cabelludo, con el objetivo de nutrir el folículo y frenar la caída.

## Para quién es

Es un tratamiento no quirúrgico, pensado para fases iniciales de caída de cabello, para reforzar el cabello existente, o como complemento antes o después de un injerto capilar.

## Cómo es el proceso

- Sesión ambulatoria, sin necesidad de anestesia general.
- Se aplican pequeñas inyecciones repartidas por el cuero cabelludo.
- Suele requerir varias sesiones espaciadas en el tiempo (el número exacto lo determina el especialista según cada caso).

## Qué esperar

No sustituye a un injerto capilar en casos de calvicie avanzada: su objetivo es fortalecer folículos que todavía están activos, no crear cabello nuevo donde ya no queda folículo viable.',
'20-30 minutos por sesión',
'[{"pregunta":"¿Duele?","respuesta":"Son microinyecciones superficiales; la mayoría de los pacientes lo describe como una molestia leve, tolerable sin anestesia."},{"pregunta":"¿Cuánto tardan en verse resultados?","respuesta":"Depende de cada caso y del número de sesiones; es tu especialista quien puede darte un calendario ajustado a tu situación."}]'::jsonb),

('prp', 'PRP Capilar', 'PRP',
'Plasma rico en plaquetas extraído de tu propia sangre, inyectado en el cuero cabelludo para estimular el crecimiento capilar.',
'## Qué es

El PRP (Plasma Rico en Plaquetas) es un tratamiento que utiliza un derivado de la propia sangre del paciente. Se extrae una muestra, se centrifuga para concentrar las plaquetas (ricas en factores de crecimiento), y ese plasma se inyecta en el cuero cabelludo.

## Para quién es

Se usa tanto de forma independiente, en fases iniciales o moderadas de pérdida de cabello, como de forma complementaria a un injerto capilar, para favorecer la cicatrización y el crecimiento de los folículos trasplantados.

## Cómo es el proceso

- Extracción de una muestra de sangre del propio paciente.
- Centrifugado para separar y concentrar el plasma rico en plaquetas.
- Inyección del plasma en las zonas del cuero cabelludo a tratar.

## Qué esperar

Al emplear un derivado de la propia sangre, el riesgo de reacciones alérgicas es muy bajo. Como con la mesoterapia, suele requerir varias sesiones y su eficacia varía según el grado de pérdida de cabello y las características de cada persona.',
'30-45 minutos por sesión',
'[{"pregunta":"¿Es lo mismo que la mesoterapia?","respuesta":"No. El PRP usa plasma de tu propia sangre, mientras que la mesoterapia inyecta un cóctel de vitaminas y principios activos externos."},{"pregunta":"¿Cuántas sesiones hacen falta?","respuesta":"Depende del caso; muchos protocolos plantean varias sesiones iniciales seguidas de sesiones de mantenimiento, siempre a valorar con el especialista."}]'::jsonb),

('micropigmentacion-capilar', 'Micropigmentación Capilar', 'Micropigmentación capilar',
'Técnica de tatuaje capilar que simula la sombra de folículos rapados, sin cirugía.',
'## Qué es

La micropigmentación capilar es una técnica que deposita pigmento en las capas superficiales del cuero cabelludo, imitando el efecto visual de folículos capilares rapados. El resultado es un efecto de densidad o de cabeza rapada uniforme.

## Para quién es

Se usa tanto para disimular la calvicie (dando sensación de densidad en zonas con poco cabello) como para camuflar cicatrices de intervenciones capilares previas (por ejemplo, la cicatriz lineal de una técnica FUT), o simplemente como opción estética de cabeza rapada definida.

## Cómo es el proceso

- Se aplican micro-implantaciones de pigmento con una aguja muy fina, replicando el patrón y densidad de un folículo real.
- El tono y la técnica se ajustan al color de piel y de cabello de cada persona.
- Suele requerir más de una sesión para consolidar el resultado final.

## Qué esperar

No es un tatuaje convencional: se usa una técnica y pigmentos específicos para lograr un efecto realista de sombra capilar. El resultado se mantiene varios años, con retoques periódicos según el caso.',
'2-4 horas por sesión, en 2-3 sesiones',
'[{"pregunta":"¿Es como un tatuaje normal?","respuesta":"No usa la misma tinta ni la misma técnica que un tatuaje decorativo; está pensada para imitar folículos capilares con un efecto realista y discreto."},{"pregunta":"¿Sirve para tapar cicatrices?","respuesta":"Sí, es una de las aplicaciones habituales, por ejemplo sobre la cicatriz lineal que deja la técnica FUT."}]'::jsonb)

on conflict (slug) do nothing;
