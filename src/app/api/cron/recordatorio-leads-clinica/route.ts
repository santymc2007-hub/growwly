import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarEmail } from "@/lib/email/resend";
import { ESTADOS_FINALES } from "@/lib/leads/estados-lead";

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
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
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

    if (!clinica?.email) continue;

    const html = construirHtmlEmail({
      nombreClinica: clinica.nombre,
      cantidad,
      enlace: `${siteUrl}/clinica/solicitudes`,
    });

    try {
      await enviarEmail({
        to: clinica.email,
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
  return `
    <div style="font-family: Arial, sans-serif; color: #33403f; max-width: 480px; margin: 0 auto;">
      <p style="color: #00768f; font-weight: bold; letter-spacing: 0.05em; text-transform: uppercase; font-size: 12px;">Growwly</p>
      <h1 style="font-size: 20px; color: #00566b;">${datos.cantidad} ${plural} esperando tu respuesta</h1>
      <p>Hola ${datos.nombreClinica},</p>
      <p>Tienes <strong>${datos.cantidad} ${plural}</strong> todavía sin propuesta enviada. Cuanto antes respondas, más opciones tienes de que el paciente te elija.</p>
      <p style="margin-top: 24px;">
        <a href="${datos.enlace}" style="background:#00c2d6; color:#fff; padding:12px 20px; border-radius:8px; text-decoration:none; font-weight:bold; display:inline-block;">
          Ver mis leads →
        </a>
      </p>
    </div>
  `;
}
