"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sanearAtribucion } from "@/lib/analytics/atribucion";
import {
  crearSolicitudCitaDirecta,
  type ResultadoSolicitudDirecta,
} from "@/lib/leads/crear-solicitud-cita-directa";
import { huellaIp } from "@/lib/seguridad/huella-ip";
import { VERSION_TEXTOS_LEGALES } from "@/lib/legal/version";

const MAX_POR_IP_HORA = 5;

/**
 * Server Action del formulario público de "Pedir cita/presupuesto" en
 * la ficha de una clínica. La lógica real (guardado + aviso por email
 * según el plan) vive en crear-solicitud-cita-directa.ts para poder
 * reutilizarla también desde el enlace de "enviar a esta alternativa"
 * del cron de solicitudes sin respuesta.
 *
 * Auditoría oct 2026: ahora exige la casilla de privacidad (el mensaje
 * puede llevar datos de salud y se envía a la clínica), guarda fecha y
 * versión de ese consentimiento, limita los envíos por IP y solo admite
 * clínicas publicadas.
 */
export async function solicitarCitaDirecta(formData: FormData): Promise<ResultadoSolicitudDirecta> {
  const clinicId = String(formData.get("clinicId") ?? "").trim();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const mensaje = String(formData.get("mensaje") ?? "").trim();
  const atribucion = sanearAtribucion(formData.get("atribucion"));

  if (formData.get("consentimiento") !== "on") {
    return {
      ok: false,
      error: "Marca la casilla para que podamos enviar tus datos a la clínica.",
    };
  }
  if (nombre.length > 200 || telefono.length > 30 || email.length > 320 || mensaje.length > 2000) {
    return { ok: false, error: "Alguno de los campos es demasiado largo." };
  }

  const supabaseAdmin = createAdminClient();

  const { data: clinica } = await supabaseAdmin
    .from("clinics")
    .select("id")
    .eq("id", clinicId)
    .eq("publicado", true)
    .maybeSingle();
  if (!clinica) {
    return { ok: false, error: "Esta clínica no admite solicitudes ahora mismo." };
  }

  const ipHash = await huellaIp();
  if (ipHash) {
    const haceUnaHora = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("solicitudes_cita_directa")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("creado_en", haceUnaHora);
    if ((count ?? 0) >= MAX_POR_IP_HORA) {
      return {
        ok: false,
        error: "Has enviado varias solicitudes seguidas. Inténtalo de nuevo dentro de una hora.",
      };
    }
  }

  return crearSolicitudCitaDirecta(supabaseAdmin, {
    clinicId,
    nombre,
    telefono,
    email,
    mensaje,
    consentimientoEn: new Date().toISOString(),
    consentimientoVersion: VERSION_TEXTOS_LEGALES,
    ipHash,
    atribucion,
  });
}
