import { NextResponse } from "next/server";
import { cronAutorizado } from "@/lib/cron/autorizado";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarEmail } from "@/lib/email/resend";
import { ESTADOS_FINALES } from "@/lib/leads/estados-lead";
import { esc } from "@/lib/email/escapar";
import { destinatariosLeads } from "@/lib/clinica/emails-leads";
import { envolverEmail, boton, ESTILO } from "@/lib/email/layout";

/**
 * Vercel Cron llama a esta ruta una vez al día (ver vercel.json). La
 * idea original era cada 12h, pero el plan Hobby de Vercel solo
 * permite un cron diario por ruta — con Pro se podría pasar a
 * "0 8,20 * * *" sin tocar el código, solo el schedule.
 * Recordatorio recurrente a cada clínica con leads todavía sin
 * propuesta — se repite en cada ejecución mientras sigan sin
 * responder, a propósito (no es un envío único).
 */
export async function GET(request: Request) {
  if (!cronAutorizado(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const { data: leadsPendientes } = await supabase
    .from("leads_clinica")
    .select("clinic_id")
    .is("propuesta_enviada_en", null)
    .not("estado", "in", `(${ESTADOS_FINALES.join(",")})`);

  const pendientesPorClinica = new Map<string, number>();
  for (const l of leadsPendientes ?? []) {
    pendientesPorClinica.set(l.clinic_id, (pendientesPorClinica.get(l.clinic_id) ?? 0) + 1);
  }

  let enviados = 0;

  for (const [clinicId, cantidad] of pendientesPorClinica) {
    const { data: clinica } = await supabase
      .from("clinics")
      .select("nombre, email")
      .eq("id", clinicId)
      .maybeSingle();

    if (!clinica) continue;
    const para = await destinatariosLeads(supabase, { id: clinicId, email: clinica.email });
    if (para.length === 0) continue;

    const html = construirHtmlEmail({
      nombreClinica: clinica.nombre,
      cantidad,
      enlace: `${siteUrl}/clinica/solicitudes`,
    });

    try {
      await enviarEmail({
        to: para,
        subject:
          cantidad === 1
            ? "Tienes 1 lead esperando respuesta"
            : `Tienes ${cantidad} leads esperando respuesta`,
        html,
      });
      enviados++;
    } catch {
      // Si falla un envío concreto seguimos con el resto — se
      // reintentará solo en 12h, como el resto de clínicas pendientes.
    }
  }

  return NextResponse.json({ ok: true, clinicasConPendientes: pendientesPorClinica.size, enviados });
}

function construirHtmlEmail(datos: {
  nombreClinica: string;
  cantidad: number;
  enlace: string;
}): string {
  const plural = datos.cantidad === 1 ? "lead" : "leads";
  return envolverEmail({
    audiencia: "clinica",
    cuerpo: `
      <h1 style="${ESTILO.h1}">${datos.cantidad} ${plural} esperando tu respuesta</h1>
      <p>Hola ${esc(datos.nombreClinica)},</p>
      <p>Tienes <strong>${datos.cantidad} ${plural}</strong> todavía sin propuesta enviada. Cuanto antes respondas, más opciones tienes de que el paciente te elija.</p>
      ${boton(`${datos.enlace}`, `Ver mis leads →`)}
    `,
  });
}
