import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarEmail } from "@/lib/email/resend";

/**
 * Vercel Cron llama a esta ruta una vez al día (ver vercel.json —
 * el plan Hobby de Vercel no admite más de un cron diario por ruta;
 * con Pro bastaría con cambiar el schedule a "0 8,20 * * *").
 * Recordatorio (único, de momento) al paciente que terminó su
 * valoración con IA hace más de 24h pero nunca llegó a pedir
 * presupuesto — un empujón funcional simple. La versión con mensajes
 * sucesivos (2º y 3º recordatorio, con un tono más cercano para
 * quitar barreras) queda pendiente de que Santy apruebe los textos.
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
  const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: estudios } = await supabase
    .from("estudios_capilares")
    .select("id, user_id, created_at")
    .eq("estado", "listo")
    .not("user_id", "is", null)
    .is("recordatorio_presupuesto_enviado_en", null)
    .lte("created_at", hace24h);

  let enviados = 0;

  for (const estudio of estudios ?? []) {
    const { data: solicitudExistente } = await supabase
      .from("solicitudes_presupuesto")
      .select("id")
      .eq("estudio_id", estudio.id)
      .maybeSingle();

    if (solicitudExistente) continue;

    const { data: perfil } = await supabase
      .from("profiles")
      .select("nombre, email")
      .eq("id", estudio.user_id!)
      .maybeSingle();

    if (!perfil?.email) continue;

    const enlace = `${siteUrl}/cuenta/analisis/${estudio.id}`;
    const html = construirHtmlEmail({ nombrePaciente: perfil.nombre, enlace });

    try {
      await enviarEmail({
        to: perfil.email,
        subject: "Tu valoración capilar sigue esperando — pide presupuesto gratis",
        html,
      });
      await supabase
        .from("estudios_capilares")
        .update({ recordatorio_presupuesto_enviado_en: new Date().toISOString() })
        .eq("id", estudio.id);
      enviados++;
    } catch {
      // Si falla el envío, no se marca como enviado — se reintentará
      // en la siguiente ejecución (cada 12h).
    }
  }

  return NextResponse.json({ ok: true, enviados });
}

function construirHtmlEmail(datos: { nombrePaciente: string | null; enlace: string }): string {
  return `
    <div style="font-family: Arial, sans-serif; color: #33403f; max-width: 480px; margin: 0 auto;">
      <p style="color: #00768f; font-weight: bold; letter-spacing: 0.05em; text-transform: uppercase; font-size: 12px;">Growwly</p>
      <h1 style="font-size: 20px; color: #00566b;">¿Seguimos?</h1>
      <p>Hola${datos.nombrePaciente ? ` ${datos.nombrePaciente}` : ""},</p>
      <p>Vimos que ya tienes tu valoración capilar con IA, pero todavía no has pedido presupuesto a ninguna clínica. Es gratis y tarda menos de 2 minutos.</p>
      <p style="margin-top: 24px;">
        <a href="${datos.enlace}" style="background:#00c2d6; color:#fff; padding:12px 20px; border-radius:8px; text-decoration:none; font-weight:bold; display:inline-block;">
          Pedir presupuesto gratis →
        </a>
      </p>
    </div>
  `;
}
