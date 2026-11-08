import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanearAtribucion } from "@/lib/analytics/atribucion";
import { esPasoEmbudo } from "@/lib/analytics/embudo-pasos";
import { registrarPasoServidor } from "@/lib/analytics/embudo-servidor";

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

  const consentimiento = body.consentimiento === true;
  const atribucion = consentimiento ? sanearAtribucion(body.atribucion) : null;
  const detalle = typeof body.detalle === "string" ? body.detalle : null;

  await registrarPasoServidor(createAdminClient(), body.paso, { atribucion, consentimiento, detalle });
  return NextResponse.json({ ok: true });
}
