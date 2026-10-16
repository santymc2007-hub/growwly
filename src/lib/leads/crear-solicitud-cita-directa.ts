import type { Atribucion } from "@/lib/analytics/atribucion";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { enviarEmail } from "@/lib/email/resend";
import { esc } from "@/lib/email/escapar";
import { clinicaEstaRegistrada } from "@/lib/clinica/registrada";

export type ResultadoSolicitudDirecta = { ok: true } | { ok: false; error: string };

export type DatosSolicitudDirecta = {
  clinicId: string;
  nombre: string;
  telefono: string;
  email: string;
  mensaje: string;
  /** Campaña de la que viene (gclid, utm…), ya saneada. */
  atribucion?: Atribucion | null;
};

/**
 * Petición de cita/presupuesto directa a UNA clínica concreta — sin
 * reparto entre varias clínicas ni paywall para el paciente. Lo que
 * varía según el plan de la clínica es si puede VER lo que ha llegado:
 *
 *   - Premium: recibe el aviso completo por email, como siempre.
 *   - Básica registrada: recibe un aviso SIN datos del paciente (solo
 *     que ha llegado algo) con CTA a Premium, y la ve bloqueada en su
 *     panel.
 *   - No registrada (sin cuenta): no se le envía nada — así no es
 *     comunicación comercial no solicitada a quien no gestiona la
 *     ficha.
 *
 * La solicitud siempre se guarda igual, pase lo que pase con el aviso,
 * porque el cron de "sin respuesta" (Punto 3 del plan Básico/Premium)
 * necesita verla para poder ofrecer alternativas al paciente. Usado
 * tanto por la Server Action del formulario público como por el
 * enlace de "enviar a esta alternativa" de ese mismo cron.
 */
export async function crearSolicitudCitaDirecta(
  supabaseAdmin: SupabaseClient<Database>,
  datos: DatosSolicitudDirecta,
): Promise<ResultadoSolicitudDirecta> {
  const { clinicId, nombre, telefono, email, mensaje } = datos;

  if (!clinicId || !nombre || !telefono) {
    return { ok: false, error: "Faltan datos obligatorios." };
  }

  try {
    const { error } = await supabaseAdmin.from("solicitudes_cita_directa").insert({
      clinic_id: clinicId,
      nombre,
      telefono,
      email: email || null,
      mensaje: mensaje || null,
      atribucion: datos.atribucion ?? null,
    });

    if (error) {
      return { ok: false, error: "No se ha podido enviar la solicitud. Inténtalo de nuevo." };
    }

    const { data: clinica } = await supabaseAdmin
      .from("clinics")
      .select("email, nombre, plan")
      .eq("id", clinicId)
      .maybeSingle();

    if (clinica?.email) {
      const registrada = await clinicaEstaRegistrada(supabaseAdmin, clinicId);
      const esPremium = clinica.plan === "premium";

      try {
        if (esPremium) {
          await enviarEmail({
            to: clinica.email,
            subject: `Nueva petición de cita en Growwly — ${nombre}`,
            html: construirHtmlCita({
              clinicaNombre: clinica.nombre,
              nombre,
              telefono,
              email,
              mensaje,
            }),
          });
        } else if (registrada) {
          await enviarEmail({
            to: clinica.email,
            subject: "Tienes una solicitud de presupuesto en Growwly",
            html: construirHtmlBloqueada({ clinicaNombre: clinica.nombre }),
          });
        }
        // No registrada: no se envía nada, pero la solicitud ya ha
        // quedado guardada para el cron de alternativas.
      } catch {
        // La solicitud ya ha quedado guardada — si falla solo el aviso
        // por email, no hacemos que el visitante vea un error.
      }
    }

    return { ok: true };
  } catch {
    // Cualquier fallo inesperado (red, timeout...) llega aquí en vez
    // de tumbar el flujo sin control.
    return { ok: false, error: "No se ha podido enviar la solicitud. Inténtalo de nuevo." };
  }
}

function construirHtmlCita(datos: {
  clinicaNombre: string;
  nombre: string;
  telefono: string;
  email: string;
  mensaje: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; color: #33403f; max-width: 480px; margin: 0 auto;">
      <p style="color: #00768f; font-weight: bold; letter-spacing: 0.05em; text-transform: uppercase; font-size: 12px;">Growwly</p>
      <h1 style="font-size: 20px; color: #00566b;">Nueva petición de cita</h1>
      <p>Hola ${esc(datos.clinicaNombre)},</p>
      <p>Alguien ha pedido cita directamente desde tu ficha en Growwly:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
        <tr><td style="padding:4px 0; color:#66756f;">Nombre</td><td style="padding:4px 0; text-align:right; font-weight:bold;">${esc(datos.nombre)}</td></tr>
        <tr><td style="padding:4px 0; color:#66756f;">Teléfono</td><td style="padding:4px 0; text-align:right; font-weight:bold;">${esc(datos.telefono)}</td></tr>
        ${datos.email ? `<tr><td style="padding:4px 0; color:#66756f;">Email</td><td style="padding:4px 0; text-align:right; font-weight:bold;">${esc(datos.email)}</td></tr>` : ""}
      </table>
      ${
        datos.mensaje
          ? `<p style="background:#eef6f1; padding:12px; border-radius:8px; font-size:13px;"><strong>Mensaje:</strong> ${esc(datos.mensaje)}</p>`
          : ""
      }
      <p style="font-size: 12px; color: #66756f; margin-top: 24px;">
        Este email lo has recibido porque tu clínica está en el directorio de Growwly.
      </p>
    </div>
  `;
}

function construirHtmlBloqueada(datos: { clinicaNombre: string }): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const enlace = `${siteUrl}/clinica/visibilidad`;
  return `
    <div style="font-family: Arial, sans-serif; color: #33403f; max-width: 480px; margin: 0 auto;">
      <p style="color: #00768f; font-weight: bold; letter-spacing: 0.05em; text-transform: uppercase; font-size: 12px;">Growwly</p>
      <h1 style="font-size: 20px; color: #00566b;">Tienes una solicitud de presupuesto</h1>
      <p>Hola ${esc(datos.clinicaNombre)},</p>
      <p>Un paciente ha pedido cita directamente desde tu ficha en Growwly. Tu plan actual no incluye ver los datos del paciente ni responder a sus solicitudes — eso forma parte del plan PREMIUM.</p>
      <p style="margin-top: 24px;">
        <a href="${enlace}" style="background:#00c2d6; color:#fff; padding:12px 20px; border-radius:8px; text-decoration:none; font-weight:bold; display:inline-block;">
          Pasa a PREMIUM para verla y responder →
        </a>
      </p>
      <p style="font-size: 12px; color: #66756f; margin-top: 24px;">
        Si no actualizas el plan no pasa nada — pero ni esta solicitud ni las que lleguen después las podrás ver mientras la ficha esté en el plan básico.
      </p>
    </div>
  `;
}
