const SYSTEM_PROMPT = `Revisas UNA foto que un usuario acaba de subir para un análisis
capilar orientativo, antes de que la envíe definitivamente. Tu única tarea es
decirle si la foto sirve o si debería intentar otra.

Evalúa dos cosas:
1. Calidad técnica: ¿está lo bastante enfocada, bien iluminada (ni muy oscura
   ni muy quemada) y con resolución suficiente para apreciar el cuero
   cabelludo y la línea de nacimiento del pelo?
2. Orientación: el usuario dice que esta foto es "{ORIENTACION}". ¿La foto
   realmente muestra esa parte/ángulo de la cabeza?

Sé razonable, no exigente en exceso — el objetivo es pillar fotos claramente
inservibles (borrosas, muy oscuras, que no muestran la cabeza, o que muestran
un ángulo distinto al indicado), no rechazar fotos aceptables.

Responde ÚNICAMENTE con un JSON válido (sin texto antes ni después, sin
backticks) con esta forma exacta:
{
  "calidad_ok": true o false,
  "orientacion_ok": true o false,
  "mensaje": "si alguna de las dos es false, una frase muy breve en español
    explicando qué falla (ej. 'Se ve borrosa' o 'Esto parece un perfil, no
    una foto frontal'); si ambas son true, cadena vacía"
}`;

export type ResultadoVerificacion = {
  ok: boolean;
  mensaje: string;
};

export async function verificarCalidadFoto(
  base64: string,
  mediaType: string,
  orientacionEsperada: string,
): Promise<ResultadoVerificacion> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Sin clave configurada, no bloqueamos al usuario — simplemente no
    // comprobamos nada.
    return { ok: true, mensaje: "" };
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: SYSTEM_PROMPT.replace("{ORIENTACION}", orientacionEsperada),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            { type: "text", text: "Revisa esta foto y responde solo con el JSON." },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    // Si la comprobación falla técnicamente, no bloqueamos al usuario.
    return { ok: true, mensaje: "" };
  }

  const data = await response.json();
  const textBlock = data.content?.find(
    (block: { type: string }) => block.type === "text",
  );
  const raw = (textBlock?.text ?? "").trim();

  try {
    const parsed = JSON.parse(raw);
    const ok = Boolean(parsed.calidad_ok) && Boolean(parsed.orientacion_ok);
    return { ok, mensaje: ok ? "" : String(parsed.mensaje ?? "") };
  } catch {
    return { ok: true, mensaje: "" };
  }
}
