"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { enviarEmail } from "@/lib/email/resend";

type Resultado = { ok: true } | { ok: false; error: string };

/**
 * Petición de cita directa a UNA clínica concreta desde su ficha
 * pública — sin login. A diferencia de "Pedir presupuesto"
 * (/cuenta/solicitud/nueva), no se reparte entre varias clínicas ni
 * hay paywall: la clínica que aparece en la página recibe el contacto
 * directamente y gratis, como cualquier formulario de contacto.
 */
export async function solicitarCitaDirecta(formData: FormData): Promise<Resultado> {
  const clinicId = String(formData.get("clinicId") ?? "").trim();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const mensaje = String(formData.get("mensaje") ?? "").trim();

  if (!clinicId || !nombre || !telefono) {
    return { ok: false, error: "Faltan datos obligatorios." };
  }

  try {
    const supabaseAdmin = createAdminClient();

    const { error } = await supabaseAdmin.from("solicitudes_cita_directa").insert({
      clinic_id: clinicId,
      nombre,
      telefono,
      email: email || null,
      mensaje: mensaje || null,
    });

    if (error) {
      return { ok: false, error: "No se ha podido enviar la solicitud. Inténtalo de nuevo." };
    }

    const { data: clinica } = await supabaseAdmin
      .from("clinics")
      .select("email, nombre")
      .eq("id", clinicId)
      .maybeSingle();

    if (clinica?.email) {
      try {
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
      } catch {
        // La solicitud ya ha quedado guardada — si falla solo el aviso
        // por email, no hacemos que el visitante vea un error.
      }
    }

    return { ok: true };
  } catch {
    // Cualquier fallo inesperado (red, timeout...) llega aquí en vez
    // de tumbar la Server Action sin control — el visitante ve el
    // mensaje de error normal y puede reintentar.
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
      <p>Hola ${datos.clinicaNombre},</p>
      <p>Alguien ha pedido cita directamente desde tu ficha en Growwly:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
        <tr><td style="padding:4px 0; color:#66756f;">Nombre</td><td style="padding:4px 0; text-align:right; font-weight:bold;">${datos.nombre}</td></tr>
        <tr><td style="padding:4px 0; color:#66756f;">Teléfono</td><td style="padding:4px 0; text-align:right; font-weight:bold;">${datos.telefono}</td></tr>
        ${datos.email ? `<tr><td style="padding:4px 0; color:#66756f;">Email</td><td style="padding:4px 0; text-align:right; font-weight:bold;">${datos.email}</td></tr>` : ""}
      </table>
      ${
        datos.mensaje
          ? `<p style="background:#eef6f1; padding:12px; border-radius:8px; font-size:13px;"><strong>Mensaje:</strong> ${datos.mensaje}</p>`
          : ""
      }
      <p style="font-size: 12px; color: #66756f; margin-top: 24px;">
        Este email lo has recibido porque tu clínica está en el directorio de Growwly.
      </p>
    </div>
  `;
}
