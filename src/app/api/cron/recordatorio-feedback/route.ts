import { NextResponse } from "next/server";
import { cronAutorizado } from "@/lib/cron/autorizado";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarEmail } from "@/lib/email/resend";
import { esc } from "@/lib/email/escapar";
import { pieRecordatorio } from "@/lib/email/baja";
import { envolverEmail, boton, ESTILO } from "@/lib/email/layout";

/**
 * Vercel Cron llama a esta ruta una vez al día (ver vercel.json).
 * Fase 6: un día después de que la clínica marque la cita como
 * realizada, si el paciente todavía no ha dejado su valoración, se le
 * manda un único recordatorio por email con el enlace a su solicitud
 * (recordatorio_feedback_enviado_en evita mandarlo dos veces).
 */
export async function GET(request: Request) {
  if (!cronAutorizado(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const haceUnDia = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: leads } = await supabase
    .from("leads_clinica")
    .select("id, solicitud_id, clinic_id")
    .in("estado", ["cita_realizada", "convertido", "no_convertido"])
    .is("feedback_recibido_en", null)
    .is("recordatorio_feedback_enviado_en", null)
    .not("cita_realizada_en", "is", null)
    .lte("cita_realizada_en", haceUnDia);

  let enviados = 0;

  for (const lead of leads ?? []) {
    const [{ data: solicitud }, { data: clinica }] = await Promise.all([
      supabase
        .from("solicitudes_presupuesto")
        .select("id, user_id")
        .eq("id", lead.solicitud_id)
        .maybeSingle(),
      supabase.from("clinics").select("nombre").eq("id", lead.clinic_id).maybeSingle(),
    ]);

    if (!solicitud) continue;

    const { data: perfil } = await supabase
      .from("profiles")
      .select("nombre, email, acepta_recordatorios_email")
      .eq("id", solicitud.user_id)
      .maybeSingle();

    if (!perfil?.email) continue;
    // El paciente puede haber desactivado los recordatorios (en Mi
    // cuenta o con el enlace de baja del email): no se le escribe.
    if (perfil.acepta_recordatorios_email === false) continue;

    const enlace = `${siteUrl}/cuenta/solicitud/${solicitud.id}`;
    const html = construirHtmlEmail({
      nombrePaciente: perfil.nombre,
      nombreClinica: clinica?.nombre ?? "la clínica",
      enlace,
      pie: pieRecordatorio(siteUrl, solicitud.user_id),
    });

    try {
      await enviarEmail({
        to: perfil.email,
        subject: "¿Cómo fue tu cita? Cuéntanoslo en 1 minuto",
        html,
      });
      await supabase
        .from("leads_clinica")
        .update({ recordatorio_feedback_enviado_en: new Date().toISOString() })
        .eq("id", lead.id);
      enviados++;
    } catch {
      // Si falla el envío a un paciente en concreto, seguimos con el
      // resto — lo reintentará el cron del día siguiente porque no se
      // marca recordatorio_feedback_enviado_en si no se llegó a mandar.
    }
  }

  return NextResponse.json({ ok: true, enviados });
}

function construirHtmlEmail(datos: {
  nombrePaciente: string | null;
  nombreClinica: string;
  enlace: string;
  pie: string;
}): string {
  return envolverEmail({
    audiencia: "paciente",
    cuerpo: `
      <h1 style="${ESTILO.h1}">¿Cómo fue tu cita?</h1>
      <p>Hola${datos.nombrePaciente ? ` ${esc(datos.nombrePaciente)}` : ""},</p>
      <p>Vimos que ya tuviste tu cita con ${esc(datos.nombreClinica)}. ¿Nos cuentas en 1 minuto cómo fue? Tu valoración ayuda a otros pacientes a elegir mejor.</p>
      ${boton(`${datos.enlace}`, `Dejar mi valoración →`)}
      ${datos.pie}
    `,
  });
}
