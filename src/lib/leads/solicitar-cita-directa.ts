"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  crearSolicitudCitaDirecta,
  type ResultadoSolicitudDirecta,
} from "@/lib/leads/crear-solicitud-cita-directa";

/**
 * Server Action del formulario público de "Pedir cita/presupuesto" en
 * la ficha de una clínica. La lógica real (guardado + aviso por email
 * según el plan) vive en crear-solicitud-cita-directa.ts para poder
 * reutilizarla también desde el enlace de "enviar a esta alternativa"
 * del cron de solicitudes sin respuesta.
 */
export async function solicitarCitaDirecta(formData: FormData): Promise<ResultadoSolicitudDirecta> {
  const clinicId = String(formData.get("clinicId") ?? "").trim();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const mensaje = String(formData.get("mensaje") ?? "").trim();

  const supabaseAdmin = createAdminClient();
  return crearSolicitudCitaDirecta(supabaseAdmin, {
    clinicId,
    nombre,
    telefono,
    email,
    mensaje,
  });
}
