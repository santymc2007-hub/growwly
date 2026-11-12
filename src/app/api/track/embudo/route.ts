import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanearAtribucion } from "@/lib/analytics/atribucion";
import { esPasoEmbudo, PASOS_CON_ORIGEN_URL } from "@/lib/analytics/embudo-pasos";
import { registrarPasoServidor, tipoDispositivo } from "@/lib/analytics/embudo-servidor";

/**
 * Pasos del embudo que se ven en el navegador (entrar en la valoración,
 * añadir fotos, ver el resultado, dejar el email…). Sin identificadores
 * de la persona: solo paso, canal, campaña y un detalle corto.
 */
export async function POST(request: Request) {
  const texto = await request.text().catch(() => "");
  if (!texto || texto.length > 4000) return NextResponse.json({ ok: false }, { status: 400 });

  let body: Record<string, unknown> | null = null;
  try {
    body = JSON.parse(texto) as Record<string, unknown>;
  } catch {
    body = null;
  }
  if (!body || !esPasoEmbudo(body.paso)) return NextResponse.json({ ok: false }, { status: 400 });

  const detalle = typeof body.detalle === "string" ? body.detalle : null;
  const dispositivo = tipoDispositivo(request.headers.get("user-agent"));

  // Llegadas y banner de cookies: el origen viene de la URL de esa misma
  // página (no de lo guardado en el navegador), así que no depende del
  // consentimiento. Sin parámetros de campaña queda como "sin_campana".
  if (PASOS_CON_ORIGEN_URL.includes(body.paso)) {
    const origen = sanearAtribucion(body.origen);
    await registrarPasoServidor(createAdminClient(), body.paso, {
      atribucion: origen,
      consentimiento: false,
      detalle,
      dispositivo,
      canalSinAtribucion: "sin_campana",
    });
    return NextResponse.json({ ok: true });
  }

  const consentimiento = body.consentimiento === true;
  // Atribución guardada (solo con consentimiento) o, si no la hay, el
  // origen de campaña de la URL de esa misma página, que no depende de
  // cookies ni de nada guardado en el dispositivo.
  const atribucion =
    (consentimiento ? sanearAtribucion(body.atribucion) : null) ?? sanearAtribucion(body.origen);

  await registrarPasoServidor(createAdminClient(), body.paso, { atribucion, consentimiento, detalle, dispositivo });
  return NextResponse.json({ ok: true });
}
