import { NextResponse } from "next/server";
import { cronAutorizado } from "@/lib/cron/autorizado";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarEmail } from "@/lib/email/resend";
import { esc } from "@/lib/email/escapar";
import { pieRecordatorio } from "@/lib/email/baja";

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
  if (!cronAutorizado(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
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
      .select("nombre, email, acepta_recordatorios_email")
      .eq("id", estudio.user_id!)
      .maybeSingle();

    if (!perfil?.email) continue;
    // El paciente puede haber desactivado los recordatorios (en Mi
    // cuenta o con el enlace de baja del email): no se le escribe.
    if (perfil.acepta_recordatorios_email === false) continue;

    const enlace = `${siteUrl}/cuenta/analisis/${estudio.id}`;
    const html = construirHtmlEmail({
      nombrePaciente: perfil.nombre,
      enlace,
      pie: pieRecordatorio(siteUrl, estudio.user_id!),
    });

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

  // Valoraciones sin cuenta en las que la persona dejó su email en el
  // adelanto pero no llegó a escribir el código: un único aviso para
  // que vuelva a verla. Sin datos de salud en el email, solo el enlace.
  const { data: anonimos } = await supabase
    .from("estudios_capilares")
    .select("id, claim_token, email_contacto, nombre_contacto")
    .eq("estado", "listo")
    .is("user_id", null)
    .not("email_contacto", "is", null)
    .is("recordatorio_presupuesto_enviado_en", null)
    .lte("email_capturado_en", hace24h);

  let enviadosSinCuenta = 0;

  for (const estudio of anonimos ?? []) {
    try {
      await enviarEmail({
        to: estudio.email_contacto!,
        subject: "Tu valoración capilar te está esperando",
        html: construirHtmlEmailSinCuenta({
          nombre: estudio.nombre_contacto,
          enlace: `${siteUrl}/analisis/${estudio.claim_token}`,
        }),
      });
      await supabase
        .from("estudios_capilares")
        .update({ recordatorio_presupuesto_enviado_en: new Date().toISOString() })
        .eq("id", estudio.id);
      enviadosSinCuenta++;
    } catch {
      // Se reintenta en la siguiente ejecución.
    }
  }

  return NextResponse.json({ ok: true, enviados, enviadosSinCuenta });
}

function construirHtmlEmailSinCuenta(datos: { nombre: string | null; enlace: string }): string {
  return `
    <div style="font-family: Arial, sans-serif; color: #33403f; max-width: 480px; margin: 0 auto;">
      <p style="color: #00768f; font-weight: bold; letter-spacing: 0.05em; text-transform: uppercase; font-size: 12px;">Growwly</p>
      <h1 style="font-size: 20px; color: #1f5568;">Tu valoración te está esperando</h1>
      <p>Hola${datos.nombre ? ` ${esc(datos.nombre)}` : ""},</p>
      <p>Tu valoración capilar con IA está lista, pero todavía no la has visto completa. Entra, confirma tu email y la tendrás en un minuto, guardada para pedir presupuesto cuando quieras.</p>
      <p style="margin-top: 24px;">
        <a href="${datos.enlace}" style="background:#e8ef2d; color:#1f5568; padding:12px 20px; border-radius:999px; text-decoration:none; font-weight:bold; display:inline-block;">
          Ver mi valoración →
        </a>
      </p>
      <p style="margin-top: 28px; font-size: 12px; color: #66756f;">Te escribimos porque dejaste este email al hacer tu valoración en Growwly. Es el único aviso que te enviaremos.</p>
    </div>
  `;
}

function construirHtmlEmail(datos: {
  nombrePaciente: string | null;
  enlace: string;
  pie: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; color: #33403f; max-width: 480px; margin: 0 auto;">
      <p style="color: #00768f; font-weight: bold; letter-spacing: 0.05em; text-transform: uppercase; font-size: 12px;">Growwly</p>
      <h1 style="font-size: 20px; color: #00566b;">¿Seguimos?</h1>
      <p>Hola${datos.nombrePaciente ? ` ${esc(datos.nombrePaciente)}` : ""},</p>
      <p>Vimos que ya tienes tu valoración capilar con IA, pero todavía no has pedido presupuesto a ninguna clínica. Es gratis y tarda menos de 2 minutos.</p>
      <p style="margin-top: 24px;">
        <a href="${datos.enlace}" style="background:#00c2d6; color:#fff; padding:12px 20px; border-radius:8px; text-decoration:none; font-weight:bold; display:inline-block;">
          Pedir presupuesto gratis →
        </a>
      </p>
      ${datos.pie}
    </div>
  `;
}
