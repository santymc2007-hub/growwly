// Genera el texto de "descripcion" de una clínica a partir del texto
// real de su web (Markdown ya extraído por Firecrawl). Se hace en una
// llamada dedicada, aparte de la extracción JSON estructurada
// (ver importador/firecrawl.ts) — pedirle a esa misma llamada un texto
// largo y natural, mezclado con otros 10+ campos cortos, era poco fiable
// (a menudo devolvía null o un texto demasiado corto). Aquí el único
// trabajo del modelo es escribir, así que puede dedicarle más tokens y
// seguir instrucciones de estilo/longitud con más cuidado.

const SYSTEM_PROMPT = `Eres redactor/a de contenido SEO para Growwly, un directorio de clínicas y centros capilares en España. A partir del texto real extraído de la web de un centro, escribe la descripción que aparecerá en su ficha pública del directorio.

Reglas estrictas:
- Basado ÚNICAMENTE en lo que aparece en el texto que te paso. No inventes años de experiencia, cifras, premios, tecnologías ni servicios que no se mencionen explícitamente. Si el texto apenas dice nada, escribe poco y con cuidado — nunca rellenes con frases vacías o genéricas para alcanzar la longitud.
- Español, en prosa corrida (uno o dos párrafos), sin títulos, sin listas ni viñetas, sin markdown.
- Mínimo 800 caracteres contando espacios. Para llegar ahí con naturalidad, desarrolla con más detalle lo que sí aparece: en qué consiste cada tratamiento, para qué tipo de caída o necesidad sirve, cómo es el proceso o el enfoque del centro si se menciona.
- Tono humano, como lo escribiría alguien del propio equipo: natural, concreto, cercano. Que NO parezca escrito por una IA — evita frases de plantilla ("en nuestra clínica nos preocupamos por...", "comprometidos con la excelencia...", "nos avala la experiencia..."), evita encadenar bullets disfrazados de frases, evita adjetivos vacíos y superlativos ("los mejores", "líderes del sector", "resultados espectaculares", "tu mejor versión"). Nada de emojis.
- Estructura: empieza SIEMPRE hablando de lo que ofrece a nivel CAPILAR — qué tratamientos o cirugías capilares tiene (injerto, PRP, mesoterapia, tricología, micropigmentación...), para qué tipo de caída o necesidad, y su forma de trabajar si el texto la menciona. Eso es lo más importante y va primero, con más desarrollo. Solo después, si el centro también ofrece servicios no capilares (estética facial, dermatología, medicina estética...), menciónalos brevemente en un segundo plano — nunca antes que lo capilar, y nunca si no aparecen en el texto fuente.
- Bien orientado a SEO: usa de forma natural (nunca forzada ni repetida más de un par de veces) los términos que la gente busca de verdad — "injerto capilar", "caída del cabello", "alopecia", el nombre de la ciudad si aparece en el texto — sin encajonarlos de forma artificial.
- Nunca menciones que el texto viene de "la web" o "la página" — escribe como si describieras el centro directamente para alguien que está buscando clínica.
- Responde ÚNICAMENTE con el texto final de la descripción. Sin comillas envolventes, sin explicaciones antes o después, sin backticks.`;

function limpiarMarkdown(md: string | undefined, maxChars: number): string {
  if (!md) return "";
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // imágenes markdown
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // enlaces -> solo el texto
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxChars);
}

export async function generarDescripcionClinica({
  nombreClinica,
  markdownHome,
  markdownSubpagina,
  tecnicas,
}: {
  nombreClinica: string | null;
  markdownHome: string | undefined;
  markdownSubpagina: string | undefined;
  tecnicas: string[];
}): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const textoHome = limpiarMarkdown(markdownHome, 6000);
  const textoSubpagina = limpiarMarkdown(markdownSubpagina, 5000);
  const textoFuente = [textoHome, textoSubpagina].filter(Boolean).join("\n\n---\n\n");
  if (!textoFuente) return null;

  const userPrompt = `${nombreClinica ? `Nombre del centro: ${nombreClinica}\n` : ""}${
    tecnicas.length > 0
      ? `Tratamientos capilares ya identificados en la web: ${tecnicas.join(", ")}\n`
      : ""
  }
Texto extraído de su web:
"""
${textoFuente}
"""

Escribe la descripción siguiendo todas las reglas indicadas.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        // ~800-1200 caracteres en español son grosso modo 250-350 tokens
        // de salida — se deja margen de sobra para que nunca se corte.
        max_tokens: 900,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const textBlock = data.content?.find(
      (block: { type: string }) => block.type === "text",
    );
    const texto = (textBlock?.text ?? "")
      .trim()
      .replace(/^```(?:\w+)?\s*/i, "")
      .replace(/\s*```$/, "")
      .replace(/^["“]|["”]$/g, "")
      .trim();

    return texto.length > 0 ? texto : null;
  } catch {
    // No es crítico: el resto de la importación sigue funcionando y el
    // admin puede rellenar la descripción a mano.
    return null;
  }
}
