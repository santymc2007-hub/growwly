import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { enviarEmail } from "@/lib/email/resend";
import { esc } from "@/lib/email/escapar";
import { clinicaEstaRegistrada } from "@/lib/clinica/registrada";

/**
 * Aviso interno a Growwly por cada solicitud nueva, para que ninguna se
 * quede sin respuesta mientras haya pocas clínicas recibiendo leads (y
 * para usar cada una como argumento de venta con la clínica).
 *
 * Va solo a la bandeja de Growwly (ADMIN_AVISOS_EMAIL, por defecto
 * hola@growwly.es), nunca a la clínica: a la clínica se le escribe a
 * mano, una a una. Lleva el contacto del paciente para poder responderle
 * en 24-48 h, pero ningún dato de salud (ni historial, ni fotos, ni la
 * valoración).
 */
const DESTINO = process.env.ADMIN_AVISOS_EMAIL || "hola@growwly.es";

type AvisoCitaDirecta = {
  tipo: "cita_directa";
  clinicId: string;
  paciente: { nombre: string; telefono: string; email: string | null };
};

type AvisoPresupuesto = {
  tipo: "presupuesto";
  solicitudId: string;
  userId: string;
  ciudad: string | null;
  tratamientos: string[];
  clinicasNotificadas: number;
};

export async function avisarAdminNuevoLead(
  admin: SupabaseClient<Database>,
  aviso: AvisoCitaDirecta | AvisoPresupuesto,
): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.growwly.es";

  if (aviso.tipo === "cita_directa") {
    const { data: clinica } = await admin
      .from("clinics")
      .select("nombre, plan, email, telefono")
      .eq("id", aviso.clinicId)
      .maybeSingle();
    const registrada = await clinicaEstaRegistrada(admin, aviso.clinicId);
    const nombreClinica = clinica?.nombre ?? "una clínica";
    const situacion =
      clinica?.plan === "premium"
        ? "Premium: le ha llegado la solicitud completa."
        : registrada
          ? "Básica con cuenta: ha recibido un aviso sin datos del paciente."
          : "Sin cuenta: a la clínica NO le ha llegado nada. Al paciente le hemos dicho que la contactamos nosotros y le respondemos en 24-48 h.";

    await enviarEmail({
      to: DESTINO,
      subject: `Nueva petición de cita — ${nombreClinica}`,
      html: plantilla(`
        <p><strong>Pedir cita desde la ficha de ${esc(nombreClinica)}</strong></p>
        <p>${esc(situacion)}</p>
        ${bloqueClinica(clinica, nombreClinica, "un paciente que quiere pedir cita con vosotros")}
        <h3>Paciente</h3>
        <p>${esc(aviso.paciente.nombre)}<br>
        Tel.: ${esc(aviso.paciente.telefono)}<br>
        ${aviso.paciente.email ? `Email: ${esc(aviso.paciente.email)}` : "Sin email"}</p>
        <p style="color:#666;font-size:13px">No pases los datos del paciente a una clínica sin cuenta: primero tiene que registrarse y aceptar las condiciones de datos.</p>
      `),
    });
    return;
  }

  const { data: perfil } = await admin
    .from("profiles")
    .select("nombre, email, telefono")
    .eq("id", aviso.userId)
    .maybeSingle();

  const tratamientos =
    aviso.tratamientos.length > 0 ? aviso.tratamientos.join(", ") : "Que decida el médico";

  await enviarEmail({
    to: DESTINO,
    subject: `Nueva solicitud de presupuesto${aviso.ciudad ? ` — ${aviso.ciudad}` : ""}`,
    html: plantilla(`
      <p><strong>Solicitud de presupuesto del asistente</strong></p>
      <p>Clínicas avisadas: <strong>${aviso.clinicasNotificadas}</strong>.
      ${
        aviso.clinicasNotificadas === 0
          ? "Ninguna clínica la ha recibido. Al paciente le hemos dicho que en 24-48 h le escribimos con su respuesta."
          : ""
      }</p>
      <p>Ciudad: ${esc(aviso.ciudad ?? "sin indicar")}<br>
      Tratamientos de interés: ${esc(tratamientos)}</p>
      <p>Para buscar clínica: llama a centros de esa zona que hagan esos tratamientos, ofréceles registrarse gratis y, cuando hayan aceptado las condiciones de datos, activa sus leads en el panel de admin.</p>
      <h3>Paciente (para responderle)</h3>
      <p>${esc(perfil?.nombre ?? "Sin nombre")}<br>
      ${perfil?.email ? `Email: ${esc(perfil.email)}<br>` : ""}
      ${perfil?.telefono ? `Tel.: ${esc(perfil.telefono)}` : ""}</p>
      <p style="color:#666;font-size:13px">Ref. solicitud: ${esc(aviso.solicitudId)} · <a href="${esc(siteUrl)}/admin/leads">Panel de leads</a></p>
    `),
  });
}

function bloqueClinica(
  clinica: { email: string | null; telefono: string | null } | null,
  nombreClinica: string,
  motivo: string,
): string {
  const texto = `Hola, soy Santy, de Growwly (growwly.es), el directorio de clínicas capilares de Mallorca. Os escribo porque a través de vuestra ficha nos ha llegado ${motivo}. Para que os lo podamos pasar, solo tenéis que activar vuestra ficha, es gratis: ${"https://www.growwly.es/clinica/registro"}. Si preferís, os llamo y lo vemos en 5 minutos.`;
  const mailto = clinica?.email
    ? `mailto:${encodeURIComponent(clinica.email)}?subject=${encodeURIComponent(
        `Un paciente quiere contactar con ${nombreClinica}`,
      )}&body=${encodeURIComponent(texto)}`
    : null;

  return `
    <h3>Clínica</h3>
    <p>${esc(nombreClinica)}<br>
    ${clinica?.telefono ? `Tel.: <a href="tel:${esc(clinica.telefono)}">${esc(clinica.telefono)}</a><br>` : ""}
    ${clinica?.email ? `Email: ${esc(clinica.email)}` : "Sin email en la ficha"}</p>
    ${mailto ? `<p><a href="${esc(mailto)}">Escribir a la clínica con el texto preparado</a></p>` : ""}
    <p style="background:#f3f6f5;padding:12px;border-radius:8px;font-size:14px">${esc(texto)}</p>
  `;
}

function plantilla(cuerpo: string): string {
  return `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#1f2a2e;max-width:600px">${cuerpo}</div>`;
}
