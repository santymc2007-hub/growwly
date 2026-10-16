import { NextResponse } from "next/server";

type Params = { token: string };

/**
 * Enlace antiguo de "Enviarles mi solicitud" (emails enviados antes del
 * 16 oct 2026). Antes reenviaba la solicitud al abrirlo; ahora solo
 * lleva a la pantalla de confirmación, porque los antivirus de correo
 * abren los enlaces y la mandaban sin que el paciente lo pidiera.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<Params> },
) {
  const { token } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  return NextResponse.redirect(
    `${siteUrl}/solicitudes/reenviar/${encodeURIComponent(token)}`,
    307,
  );
}
