import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { enviarEmail } from "@/lib/email/resend";

const PROGRESION_LABEL: Record<string, string> = {
  lenta: "Lenta",
  moderada: "Moderada",
  rapida: "Rápida",
};
const CUANDO_LABEL: Record<string, string> = {
  inmediatamente: "Inmediatamente",
  "3_meses": "En los próximos 3 meses",
  este_anio: "Este año, sin prisa",
};
const PRESUPUESTO_LABEL: Record<string, string> = {
  menos_3000: "Menos de 3.000€",
  "3000_5000": "3.000€ - 5.000€",
  "5000_7000": "5.000€ - 7.000€",
  mas_7000: "Más de 7.000€",
};

/**
 * Busca las clínicas que encajan con una solicitud (ciudad + técnicas de
 * interés), crea un lead con token único por cada una, y les manda un
 * email con un resumen anonimizado + el enlace a ese lead.
 *
 * `supabaseAdmin` debe ser el cliente con la clave secreta (createAdminClient),
 * porque necesita leer todas las clínicas y escribir en leads_clinica
 * saltándose RLS.
 */
export async function notificarClinicasDeSolicitud(
  supabaseAdmin: SupabaseClient<Database>,
  solicitudId: string,
): Promise<{ candidatas: number; notificadas: number; ultimoError: string | null }> {
  const { data: solicitud } = await supabaseAdmin
    .from("solicitudes_presupuesto")
    .select("*")
    .eq("id", solicitudId)
    .maybeSingle();

  if (!solicitud) {
    return { candidatas: 0, notificadas: 0, ultimoError: "Solicitud no encontrada" };
  }

  let resumenIA: string | null = null;
  if (solicitud.estudio_id) {
    const { data: estudio } = await supabaseAdmin
      .from("estudios_capilares")
      .select("resultado_texto")
      .eq("id", solicitud.estudio_id)
      .maybeSingle();
    resumenIA = estudio?.resultado_texto ?? null;
  }

  let query = supabaseAdmin
    .from("clinics")
    .select("id, nombre, email, ciudad, tecnicas")
    .not("email", "is", null);

  if (solicitud.donde_tratamiento === "solo_ciudad" && solicitud.ciudad) {
    query = query.ilike("ciudad", solicitud.ciudad.trim());
  }

  if (!solicitud.dejar_decidir_medico && solicitud.tratamientos_interes.length > 0) {
    query = query.overlaps("tecnicas", solicitud.tratamientos_interes);
  }

  const { data: clinicas } = await query;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const candidatas = (clinicas ?? []).filter((c) => c.email).length;
  let notificadas = 0;
  let ultimoError: string | null = null;

  for (const clinica of clinicas ?? []) {
    if (!clinica.email) continue;

    const { data: lead } = await supabaseAdmin
      .from("leads_clinica")
      .upsert(
        { solicitud_id: solicitud.id, clinic_id: clinica.id },
        { onConflict: "solicitud_id,clinic_id", ignoreDuplicates: true },
      )
      .select()
      .single();

    if (!lead) continue;

    const enlace = `${siteUrl}/leads/${lead.token}`;
    const html = construirHtmlEmail({
      clinicaNombre: clinica.nombre,
      ciudad: solicitud.ciudad,
      tratamientos: solicitud.dejar_decidir_medico
        ? "Deja que el médico decida la mejor técnica"
        : solicitud.tratamientos_interes.join(", ") || "Sin especificar",
      cuando: solicitud.cuando_tratamiento
        ? CUANDO_LABEL[solicitud.cuando_tratamiento]
        : null,
      presupuesto: solicitud.presupuesto_rango
        ? PRESUPUESTO_LABEL[solicitud.presupuesto_rango]
        : null,
      progresion: solicitud.progresion_perdida
        ? PROGRESION_LABEL[solicitud.progresion_perdida]
        : null,
      resumenIA,
      enlace,
    });

    try {
      await enviarEmail({
        to: clinica.email,
        subject: "Nueva solicitud de presupuesto en Growwly",
        html,
      });
      notificadas++;
    } catch (e) {
      // Si falla el envío a una clínica en concreto, seguimos con el
      // resto, pero guardamos el motivo para poder diagnosticarlo.
      ultimoError = e instanceof Error ? e.message : String(e);
    }
  }

  return { candidatas, notificadas, ultimoError };
}

function construirHtmlEmail(datos: {
  clinicaNombre: string;
  ciudad: string | null;
  tratamientos: string;
  cuando: string | null;
  presupuesto: string | null;
  progresion: string | null;
  resumenIA: string | null;
  enlace: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; color: #33403f; max-width: 480px; margin: 0 auto;">
      <p style="color: #00768f; font-weight: bold; letter-spacing: 0.05em; text-transform: uppercase; font-size: 12px;">Growwly</p>
      <h1 style="font-size: 20px; color: #00566b;">Nueva solicitud de presupuesto</h1>
      <p>Hola ${datos.clinicaNombre},</p>
      <p>Un paciente ha pedido presupuesto a través de Growwly y tu clínica encaja con lo que busca:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
        ${datos.ciudad ? fila("Ciudad", datos.ciudad) : ""}
        ${fila("Tratamientos de interés", datos.tratamientos)}
        ${datos.progresion ? fila("Progresión de la pérdida", datos.progresion) : ""}
        ${datos.cuando ? fila("Cuándo quiere el tratamiento", datos.cuando) : ""}
        ${datos.presupuesto ? fila("Presupuesto aproximado", datos.presupuesto) : ""}
      </table>
      ${
        datos.resumenIA
          ? `<p style="background:#eef6f1; padding:12px; border-radius:8px; font-size:13px;"><strong>Primera impresión orientativa:</strong> ${datos.resumenIA}</p>`
          : ""
      }
      <p style="margin-top: 24px;">
        <a href="${datos.enlace}" style="background:#00c2d6; color:#fff; padding:12px 20px; border-radius:8px; text-decoration:none; font-weight:bold; display:inline-block;">
          Ver solicitud →
        </a>
      </p>
      <p style="font-size: 12px; color: #66756f; margin-top: 24px;">
        Este email lo has recibido porque tu clínica está en el directorio de Growwly.
      </p>
    </div>
  `;
}

function fila(label: string, valor: string): string {
  return `<tr><td style="padding:4px 0; color:#66756f;">${label}</td><td style="padding:4px 0; text-align:right; font-weight:bold;">${valor}</td></tr>`;
}
