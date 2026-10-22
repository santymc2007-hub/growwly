import type { Atribucion } from "@/lib/analytics/atribucion";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { enviarEmail } from "@/lib/email/resend";
import { esc } from "@/lib/email/escapar";
import { clinicaEstaRegistrada } from "@/lib/clinica/registrada";
import { destinatariosLeads } from "@/lib/clinica/emails-leads";
import { avisarAdminNuevoLead } from "@/lib/email/aviso-admin-lead";
import { clinicaAceptoCondicionesDatos } from "@/lib/clinica/condiciones-datos";
import { envolverEmail, boton, ESTILO, filaDato, tablaDatos } from "@/lib/email/layout";

export type ResultadoSolicitudDirecta =
  /** clinicaConCuenta: si la clínica tiene cuenta (le llega algo) o no. Decide el mensaje al paciente. */
  | { ok: true; clinicaConCuenta: boolean }
  | { ok: false; error: string };

export type DatosSolicitudDirecta = {
  clinicId: string;
  nombre: string;
  telefono: string;
  email: string;
  mensaje: string;
  /** Cuándo y a qué versión de los textos dijo que sí (casilla del formulario). */
  consentimientoEn?: string | null;
  consentimientoVersion?: string | null;
  /** Huella de IP para limitar envíos (se borra a los 30 días). */
  ipHash?: string | null;
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
      consentimiento_en: datos.consentimientoEn ?? null,
      consentimiento_version: datos.consentimientoVersion ?? null,
      ip_hash: datos.ipHash ?? null,
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

    const para = clinica
      ? await destinatariosLeads(supabaseAdmin, { id: clinicId, email: clinica.email })
      : [];

    const registrada = await clinicaEstaRegistrada(supabaseAdmin, clinicId);
    const clinicaConCuenta = registrada || clinica?.plan === "premium";

    // Aviso interno a Growwly: con pocas clínicas recibiendo leads,
    // nadie más respondería a esta persona.
    try {
      await avisarAdminNuevoLead(supabaseAdmin, {
        tipo: "cita_directa",
        clinicId,
        paciente: { nombre, telefono, email: email || null },
      });
    } catch {
      // Si falla el aviso interno, la solicitud ya está guardada.
    }

    if (clinica && para.length > 0) {
      const esPremium = clinica.plan === "premium";

      // Una clínica de pago que aún no ha aceptado las condiciones sobre
      // datos de pacientes recibe el aviso sin datos: los verá en su
      // panel después de aceptarlas.
      const aceptoCondiciones =
        esPremium && (await clinicaAceptoCondicionesDatos(supabaseAdmin, clinicId));

      try {
        if (esPremium && !aceptoCondiciones) {
          await enviarEmail({
            to: para,
            subject: "Tienes una petición de cita en Growwly",
            html: construirHtmlSinDatos({ clinicaNombre: clinica.nombre }),
          });
        } else if (esPremium) {
          await enviarEmail({
            to: para,
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
            to: para,
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

    return { ok: true, clinicaConCuenta };
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
  return envolverEmail({
    audiencia: "clinica",
    cuerpo: `
      <h1 style="${ESTILO.h1}">Nueva petición de cita</h1>
      <p>Hola ${esc(datos.clinicaNombre)},</p>
      <p>Alguien ha pedido cita directamente desde tu ficha en Growwly:</p>
      ${tablaDatos(
          filaDato("Nombre", esc(datos.nombre)) +
          filaDato("Teléfono", esc(datos.telefono)) +
          (datos.email ? filaDato("Email", esc(datos.email)) : ""),
        )}
      ${
        datos.mensaje
          ? `<p style="${ESTILO.caja} font-size:14px;"><strong>Mensaje:</strong> ${esc(datos.mensaje)}</p>`
          : ""
      }
    `,
  });
}

function construirHtmlBloqueada(datos: { clinicaNombre: string }): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const enlace = `${siteUrl}/clinica/visibilidad`;
  return envolverEmail({
    audiencia: "clinica",
    cuerpo: `
      <h1 style="${ESTILO.h1}">Tienes una solicitud de presupuesto</h1>
      <p>Hola ${esc(datos.clinicaNombre)},</p>
      <p>Un paciente ha pedido cita directamente desde tu ficha en Growwly. Tu plan actual no incluye ver los datos del paciente ni responder a sus solicitudes — eso forma parte del plan PREMIUM.</p>
      ${boton(`${enlace}`, `Pasa a PREMIUM para verla y responder →`)}
      <p style="${ESTILO.nota} margin-top:20px;">
        Si no actualizas el plan no pasa nada — pero ni esta solicitud ni las que lleguen después las podrás ver mientras la ficha esté en el plan básico.
      </p>
    `,
  });
}

function construirHtmlSinDatos(datos: { clinicaNombre: string }): string {
  const enlace = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/clinica/solicitudes`;
  return envolverEmail({
    audiencia: "clinica",
    cuerpo: `
      <h1 style="${ESTILO.h1}">Tienes una petición de cita</h1>
      <p>Hola ${esc(datos.clinicaNombre)},</p>
      <p>Alguien ha pedido cita directamente desde tu ficha en Growwly. Para ver sus datos, entra en tu panel y acepta antes las condiciones sobre datos de pacientes (solo se piden una vez).</p>
      ${boton(`${enlace}`, `Ver la petición →`)}
    `,
  });
}
