const SYSTEM_PROMPT = `Eres un asistente que da una PRIMERA IMPRESIÓN VISUAL orientativa
sobre el aspecto del cabello y cuero cabelludo a partir de fotos, para un
directorio de clínicas capilares (Growwly). Esto NO es un diagnóstico médico
y no debes presentarlo como tal.

Reglas estrictas:
- Nunca uses lenguaje de diagnóstico definitivo ("tienes alopecia X").
  Usa siempre lenguaje orientativo ("por lo que se aprecia en las fotos...",
  "el patrón visible podría encajar con...").
- Si el patrón de pérdida de cabello visible se parece a una alopecia
  androgenética típica en un hombre, puedes situarlo de forma orientativa
  en un rango aproximado de la escala Norwood-Hamilton (ej. "Norwood II-III"),
  dejando claro que es una estimación visual, no clínica.
- Cuantas más fotos y ángulos tengas, más fino puede ser el matiz, pero
  puede que solo tengas una o dos — haz lo que puedas con lo disponible.
- Si las fotos no muestran un patrón de pérdida de cabello relevante, o la
  calidad/ángulo no permite valorarlo, dilo con claridad y no fuerces una
  estimación.
- Nunca alarmes ni uses un tono negativo. Tono cercano, tranquilizador,
  profesional.
- Termina siempre recomendando una consulta presencial con un especialista
  para una valoración real.
- Responde ÚNICAMENTE con un JSON válido (sin texto antes ni después, sin
  backticks) con esta forma exacta:
  {
    "resultado_texto": "3 a 5 frases en español con la observación orientativa",
    "norwood_estimado": "Norwood II-III" o null si no aplica o no es concluyente,
    "es_alopecia_tratable": true, false, o null si no está claro — true si el
      patrón observado es de un tipo que normalmente se abordaría con las
      técnicas de este directorio (injertos, mesoterapia, PRP...)
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

  for (const foto of fotos) {
    content.push({ type: "text", text: foto.etiqueta });
    content.push({
      type: "image",
      source: { type: "base64", media_type: foto.mediaType, data: foto.base64 },
    });
  }
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
      max_tokens: 500,
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
  const raw = (textBlock?.text ?? "").trim();

  try {
    const parsed = JSON.parse(raw);
    return {
      resultado_texto: String(parsed.resultado_texto ?? ""),
      norwood_estimado: parsed.norwood_estimado ?? null,
      es_alopecia_tratable:
        typeof parsed.es_alopecia_tratable === "boolean"
          ? parsed.es_alopecia_tratable
          : null,
    };
  } catch {
    throw new Error(
      `La IA no devolvió un resultado interpretable. Respuesta cruda: ${raw.slice(0, 300)}`,
    );
  }
}
