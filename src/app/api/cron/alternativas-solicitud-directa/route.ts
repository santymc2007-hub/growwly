import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cronAutorizado } from "@/lib/cron/autorizado";
import { buscarClinicasAlternativas, type ClinicaAlternativa } from "@/lib/leads/clinicas-alternativas";
import { enviarEmail } from "@/lib/email/resend";
import { esc } from "@/lib/email/escapar";
import { randomUUID } from "crypto";

const HORAS_ESPERA = 48;

/**
 * Punto 3 del plan Básico/Premium: si una solicitud de cita/presupuesto
 * directa no se ha marcado como respondida en 48h, avisamos al
 * paciente por email (honesto, sin culpar a la clínica ni mencionar
 * planes de pago) y le ofrecemos hasta 3 clínicas alternativas de su
 * misma ciudad. Cada enlace lleva a una pantalla donde el paciente
 * confirma el envío con un botón (abrir el enlace no envía nada).
 */
export async function GET(request: Request) {
  if (!cronAutorizado(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const admin = createAdminClient();
  const limite = new Date(Date.now() - HORAS_ESPERA * 60 * 60 * 1000).toISOString();

  const { data: solicitudes } = await admin
    .from("solicitudes_cita_directa")
    .select("id, clinic_id, email, creado_en")
    .is("respondida_en", null)
    .is("alternativas_enviadas_en", null)
    .lte("creado_en", limite);

  let procesadas = 0;
  let emailsEnviados = 0;

  for (const solicitud of solicitudes ?? []) {
    try {
      if (solicitud.email) {
        const { data: clinica } = await admin
          .from("clinics")
          .select("nombre, ciudad")
          .eq("id", solicitud.clinic_id)
          .maybeSingle();

        if (clinica) {
          const alternativas = await buscarClinicasAlternativas(admin, {
            ciudad: clinica.ciudad,
            excluirClinicId: solicitud.clinic_id,
          });

          if (alternativas.length > 0) {
            const conToken = await Promise.all(
              alternativas.map(async (alt) => {
                const token = randomUUID();
                await admin.from("solicitudes_cita_directa_alternativas").insert({
                  solicitud_id: solicitud.id,
                  clinic_id: alt.id,
                  token,
                });
                return { ...alt, token };
              }),
            );

            await enviarEmail({
              to: solicitud.email,
              subject: "Esta clínica no ha respondido — aquí tienes alternativas",
              html: construirHtmlAviso({
                clinicaOriginalNombre: clinica.nombre,
                alternativas: conToken,
                siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "",
              }),
            });
            emailsEnviados++;
          }
        }
      }

      await admin
        .from("solicitudes_cita_directa")
        .update({ alternativas_enviadas_en: new Date().toISOString() })
        .eq("id", solicitud.id);

      procesadas++;
    } catch (e) {
      // Seguimos con el resto de solicitudes aunque falle una —
      // volverá a intentarse al día siguiente porque no se marca
      // alternativas_enviadas_en si no llegamos hasta aquí.
      console.error("Error procesando alternativas para solicitud", solicitud.id, e);
    }
  }

  return NextResponse.json({ ok: true, procesadas, emailsEnviados });
}

function construirHtmlAviso(datos: {
  clinicaOriginalNombre: string;
  alternativas: (ClinicaAlternativa & { token: string })[];
  siteUrl: string;
}): string {
  const logoUrl = `${datos.siteUrl}/brand/growwly-logo-white.png`;

  const filas = datos.alternativas
    .map((alt) => {
      const enlace = `${datos.siteUrl}/solicitudes/reenviar/${alt.token}`;
      const rating =
        alt.ratingGoogle != null
          ? `★ ${alt.ratingGoogle.toFixed(1)}${alt.resenasGoogle ? ` (${alt.resenasGoogle})` : ""}`
          : "";
      const tiempo =
        alt.tiempoRespuestaPromedioMinutos != null
          ? `<div style="font-size: 11px; color: #1f6b43; background: #cfebdc; display: inline-block; margin-top: 6px; padding: 3px 10px; border-radius: 999px;">Responde en ~${Math.max(1, Math.round(alt.tiempoRespuestaPromedioMinutos / 60))} h</div>`
          : "";
      const foto = alt.fotoUrl
        ? `<img src="${esc(alt.fotoUrl)}" alt="" width="56" height="56" style="width:56px;height:56px;border-radius:12px;object-fit:cover;flex-shrink:0;" />`
        : `<div style="width:56px;height:56px;border-radius:12px;background:#cfebdc;flex-shrink:0;"></div>`;
      return `
        <a href="${enlace}" style="display:flex;align-items:center;gap:14px;text-decoration:none;border:1px solid #e1e8e6;border-radius:16px;padding:14px 18px;margin-bottom:14px;">
          ${foto}
          <div style="flex:1;min-width:0;">
            <div style="font-size:14px;font-weight:600;color:#33403f;">${esc(alt.nombre)}</div>
            <div style="font-size:12px;color:#66756f;margin-top:2px;">${esc(alt.ciudad ?? "")}${rating ? ` · ${rating}` : ""}</div>
            ${tiempo}
          </div>
          <div style="flex-shrink:0;background:#e8ef2d;color:#1f5568;font-weight:700;font-size:13px;padding:10px 16px;border-radius:999px;white-space:nowrap;">
            Enviarles mi solicitud →
          </div>
        </a>`;
    })
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; color: #33403f; max-width: 560px; margin: 0 auto;">
      <div style="background:#1f5568;padding:20px 28px;border-radius:12px 12px 0 0;">
        <img src="${logoUrl}" alt="Growwly" height="24" style="height:24px;display:block;" />
      </div>
      <div style="border:1px solid #e1e8e6;border-top:none;border-radius:0 0 12px 12px;padding:28px;">
        <h1 style="font-size:20px;color:#00566b;margin-top:0;">Esta clínica todavía no ha respondido</h1>
        <p>Han pasado más de 48 horas desde que enviamos tu solicitud a <strong>${esc(datos.clinicaOriginalNombre)}</strong> y todavía no ha contestado. Mientras esperas, aquí tienes otras clínicas de tu zona que suelen responder rápido — puedes enviarles tu solicitud sin volver a rellenar nada.</p>
        ${filas}
        <p style="font-size:13px;color:#66756f;margin-top:16px;">Tu solicitud original sigue activa — si ${esc(datos.clinicaOriginalNombre)} responde más tarde, también lo sabrás.</p>
      </div>
    </div>
  `;
}
