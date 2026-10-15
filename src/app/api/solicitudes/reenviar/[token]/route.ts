import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { crearSolicitudCitaDirecta } from "@/lib/leads/crear-solicitud-cita-directa";

type Params = { token: string };

/**
 * Enlace de un solo uso que llega en el email de "esta clínica no ha
 * respondido" (cron de alternativas-solicitud-directa): un clic crea
 * una nueva solicitud de cita directa hacia la clínica alternativa,
 * sin pasar por ningún formulario ni pantalla de "mi cuenta" — el
 * paciente ya dio sus datos y su consentimiento en la solicitud
 * original.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<Params> },
) {
  const { token } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const admin = createAdminClient();

  const { data: alternativa } = await admin
    .from("solicitudes_cita_directa_alternativas")
    .select("id, solicitud_id, clinic_id, enviada_en")
    .eq("token", token)
    .maybeSingle();

  if (!alternativa) {
    return NextResponse.redirect(`${siteUrl}/solicitud-enviada?estado=invalido`, 307);
  }

  if (alternativa.enviada_en) {
    return NextResponse.redirect(`${siteUrl}/solicitud-enviada?estado=ya`, 307);
  }

  const [{ data: original }, { data: clinica }] = await Promise.all([
    admin
      .from("solicitudes_cita_directa")
      .select("nombre, telefono, email, mensaje")
      .eq("id", alternativa.solicitud_id)
      .maybeSingle(),
    admin.from("clinics").select("nombre").eq("id", alternativa.clinic_id).maybeSingle(),
  ]);

  if (!original) {
    return NextResponse.redirect(`${siteUrl}/solicitud-enviada?estado=invalido`, 307);
  }

  const resultado = await crearSolicitudCitaDirecta(admin, {
    clinicId: alternativa.clinic_id,
    nombre: original.nombre,
    telefono: original.telefono,
    email: original.email ?? "",
    mensaje: original.mensaje ?? "",
  });

  await admin
    .from("solicitudes_cita_directa_alternativas")
    .update({ enviada_en: new Date().toISOString() })
    .eq("id", alternativa.id);

  if (!resultado.ok) {
    return NextResponse.redirect(`${siteUrl}/solicitud-enviada?estado=error`, 307);
  }

  return NextResponse.redirect(
    `${siteUrl}/solicitud-enviada?clinica=${encodeURIComponent(clinica?.nombre ?? "")}`,
    307,
  );
}
