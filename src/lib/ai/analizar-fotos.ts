import { sanearRespuestaIA, type InformeSinRutas } from "@/lib/informe/sanear";

const SYSTEM_PROMPT = `Eres un asistente que da una PRIMERA IMPRESIÓN VISUAL orientativa
sobre el aspecto del cabello y cuero cabelludo a partir de fotos, para un
directorio de clínicas capilares (Growwly). Esto NO es un diagnóstico médico
y no debes presentarlo como tal. Solo sabes lo que se ve en las fotos: no
conoces la edad, el sexo, los antecedentes ni las causas, así que no las
supongas ni las menciones.

Tu trabajo es clasificar lo que se ve en UNO de estos 7 flujos:
- "alopecia_androgenetica_masculina": entradas y/o coronilla (vértex) con
  pérdida, patrón típico masculino. Grado en escala Norwood: "I", "II",
  "III", "IV", "V", "VI" o "VII".
- "alopecia_androgenetica_femenina": raya central ensanchada y menos
  volumen arriba, con la línea frontal conservada. Grado en escala Ludwig:
  "I", "II" o "III".
- "efluvio_telogeno": pérdida de densidad difusa y repartida por toda la
  cabeza, sin zonas calvas ni patrón claro. Grado: "Leve", "Moderada" o
  "Intensa".
- "alopecia_areata": una o varias zonas redondas sin pelo, de bordes bien
  definidos. Grado: "Placa única", "Varias placas" o "Extensa".
- "alopecia_por_traccion": pérdida en el borde de la frente y las sienes,
  con pelo fino o roto en esa línea, típica de peinados tirantes. Grado:
  "Inicial" o "Avanzada".
- "cuero_cabelludo": sin pérdida importante de pelo pero con descamación,
  escamas o rojez visibles en la piel. Grado: "Leve", "Moderada" o
  "Intensa".
- "sin_signos": densidad normal, sin nada relevante. Grado: "Sin signos" o
  "Signos leves".

Reglas:
- Si dudas entre dos flujos, elige el que mejor encaje con el patrón visible.
  Si la calidad no permite ver nada, usa "sin_signos" con grado "Sin signos"
  y dilo en "detalle".
- Intensidad de cada zona (entradas, frontal, media, coronilla, raya): una de
  "conservada", "leve", "moderada" o "marcada". "raya" es la raya central.
- "zona_donante" (nuca): "buena", "media", "limitada" o "no_valorable" si no
  hay ninguna foto donde se vea.
- "placas": solo en alopecia areata, número de placas visibles; si no, null.
- "candidato_injerto": solo en alopecia androgenética masculina ("si",
  "a_valorar" o "no", según grado y zona donante); si no, null.
- "observaciones": 4 frases MUY cortas (máx. 8 palabras) de lo que se ve,
  cada una con un "tono": "conservada", "leve", "moderada", "marcada" o
  "donante" (para la nuca).
- "fotos": una entrada por foto, en el mismo orden en que te llegan, con su
  "indice" (empezando en 1), el "angulo" que muestra y su "calidad".
  Ángulos (fíjate en la orientación de la cabeza, no en qué zona tiene
  pérdida):
    · "frontal": cabeza de frente, se ven la frente y la línea del pelo
      de lado a lado, con las dos entradas a la vez (aunque sea de cerca).
    · "perfil_derecho" / "perfil_izquierdo": cabeza de lado o en
      diagonal, se ve UNA sola entrada/sien, a menudo con la oreja o la
      patilla. Una foto de cerca de una sola entrada también es perfil.
    · "coronilla": vista desde arriba o desde atrás-arriba, se ve el
      remolino o la parte superior de la cabeza.
    · "donante": nuca / parte trasera baja de la cabeza.
    · "raya": vista desde arriba con la raya central abierta.
    · "otra": solo si no encaja en ninguna de las anteriores.
  Calidad: "buena" si se ve con claridad el pelo y el cuero cabelludo de
  esa zona (no hace falta que sea perfecta), "mejorable" si hay poca luz,
  desenfoque o el pelo tapa la zona, y "mala" solo si no se puede valorar.
- "detalle": una frase corta (máx. 14 palabras, en minúscula) que describa
  dónde está la pérdida, p. ej. "entradas marcadas y pérdida inicial en coronilla".
- "resultado_texto": 3 a 4 frases en español, tono orientativo y
  tranquilizador ("el patrón visible podría encajar con..."), para que una
  clínica entienda el caso. Nunca lenguaje de diagnóstico definitivo.

Responde ÚNICAMENTE con un JSON válido (sin texto antes ni después, sin
backticks) con esta forma exacta:
{
  "flujo": "...",
  "grado": "...",
  "detalle": "...",
  "zonas": { "entradas": "...", "frontal": "...", "media": "...", "coronilla": "...", "raya": "..." },
  "zona_donante": "...",
  "placas": null,
  "candidato_injerto": null,
  "observaciones": [ { "texto": "...", "tono": "..." } ],
  "fotos": [ { "indice": 1, "angulo": "...", "calidad": "..." } ],
  "resultado_texto": "..."
}`;

export type FotoParaAnalizar = {
  /** Etiqueta legible: "Vista frontal", "Foto adicional 1", etc. */
  etiqueta: string;
  base64: string;
  mediaType: string;
};

export type ResultadoAnalisis = {
  resultado_texto: string;
  norwood_estimado: string | null;
  es_alopecia_tratable: boolean | null;
  /** Informe estructurado por flujo, sin las rutas de las fotos. */
  informe: InformeSinRutas;
};

export async function analizarFotosCapilares(
  fotos: FotoParaAnalizar[],
): Promise<ResultadoAnalisis> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Falta configurar ANTHROPIC_API_KEY para poder analizar las fotos.",
    );
  }

  if (fotos.length === 0) {
    throw new Error("No hay ninguna foto que analizar.");
  }

  const content: Array<
    | { type: "text"; text: string }
    | {
        type: "image";
        source: { type: "base64"; media_type: string; data: string };
      }
  > = [];

  fotos.forEach((foto, i) => {
    content.push({ type: "text", text: `Foto ${i + 1} (${foto.etiqueta})` });
    content.push({
      type: "image",
      source: { type: "base64", media_type: foto.mediaType, data: foto.base64 },
    });
  });
  content.push({
    type: "text",
    text: `Analiza estas ${fotos.length} foto(s) según las reglas indicadas y responde solo con el JSON.`,
  });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      // El JSON estructurado (zonas, observaciones, una entrada por foto)
      // es bastante más largo que el antiguo resultado_texto suelto.
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Error al llamar a la IA (${response.status}): ${detail}`);
  }

  const data = await response.json();
  const textBlock = data.content?.find(
    (block: { type: string }) => block.type === "text",
  );
  // A pesar de que el prompt pide JSON sin backticks, a veces el modelo
  // lo envuelve igualmente en un bloque ```json ... ``` — se retira antes
  // de parsear en vez de fallar por algo puramente cosmético.
  const raw = (textBlock?.text ?? "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      `La IA no devolvió un resultado interpretable. Respuesta cruda: ${raw.slice(0, 300)}`,
    );
  }

  const { informe, resultadoTexto } = sanearRespuestaIA(parsed, fotos.length);

  return {
    resultado_texto: resultadoTexto,
    // Se siguen rellenando los campos antiguos: los usan el listado de
    // /cuenta, el asistente de solicitud y el resumen que ven las clínicas.
    norwood_estimado:
      informe.flujo === "alopecia_androgenetica_masculina" ? `Norwood ${informe.grado}` : null,
    es_alopecia_tratable: informe.flujo !== "sin_signos",
    informe,
  };
}
