import { NextResponse } from "next/server";
import { buscarClinicas } from "@/lib/buscador/servidor";

export const maxDuration = 30;

// Límite sencillo por IP (en memoria de cada instancia): evita que
// alguien dispare cientos de llamadas a la IA seguidas.
const usos = new Map<string, { n: number; desde: number }>();
const VENTANA_MS = 10 * 60 * 1000;
const MAX_POR_VENTANA = 20;

function permitido(ip: string): boolean {
  const ahora = Date.now();
  const u = usos.get(ip);
  if (!u || ahora - u.desde > VENTANA_MS) {
    usos.set(ip, { n: 1, desde: ahora });
    return true;
  }
  u.n += 1;
  return u.n <= MAX_POR_VENTANA;
}

/**
 * Buscador con IA (botón flotante de la web): recibe el texto libre del
 * paciente y devuelve 2–3 clínicas recomendadas con el porqué y los
 * datos para compararlas. Sin datos personales: solo el texto escrito.
 */
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  if (!permitido(ip)) {
    return NextResponse.json(
      { error: "Has hecho muchas búsquedas seguidas. Espera unos minutos y vuelve a probar." },
      { status: 429 },
    );
  }

  let texto = "";
  try {
    const body = (await request.json()) as { texto?: unknown };
    texto = String(body.texto ?? "").trim().slice(0, 600);
  } catch {
    // cuerpo inválido
  }
  if (texto.length < 4) {
    return NextResponse.json({ error: "Cuéntanos un poco más lo que buscas." }, { status: 400 });
  }

  try {
    const respuesta = await buscarClinicas(texto);
    return NextResponse.json(respuesta, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(
      { error: "No hemos podido completar la búsqueda. Vuelve a intentarlo en un momento." },
      { status: 500 },
    );
  }
}
