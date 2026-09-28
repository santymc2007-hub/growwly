import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { enviarEmail } from "@/lib/email/resend";
import { fechaCitaLarga, type OpcionCita } from "@/lib/leads/opciones-cita";

/**
 * Emails del paso "cita" entre paciente y clínica. Un fallo al enviar
 * nunca debe tumbar la acción que lo dispara, así que cada función
 * atrapa su propio error.
 */

function plantilla(titulo: string, cuerpo: string, enlace: string, boton: string) {
  return `
    <div style="font-family: Arial, sans-serif; color: #33403f; max-width: 480px; margin: 0 auto;">
      <p style="color: #00768f; font-weight: bold; letter-spacing: 0.05em; text-transform: uppercase; font-size: 12px;">Growwly</p>
      <h1 style="font-size: 20px; color: #1f5568;">${titulo}</h1>
      ${cuerpo}
      <p style="margin-top: 24px;">
        <a href="${enlace}" style="background:#e8ef2d; color:#1f5568; padding:12px 22px; border-radius:999px; text-decoration:none; font-weight:bold; display:inline-block;">
          ${boton}
        </a>
      </p>
    </div>
  `;
}

/** A la clínica: el paciente confirmó una fecha o pidió otras. */
export async function notificarClinicaCita(
  admin: SupabaseClient<Database>,
  params: {
    leadId: string;
    clinicId: string;
    tipo: "confirmada" | "otras_fechas";
    opcion?: OpcionCita;
  },
): Promise<void> {
  try {
    const [{ data: lead }, { data: clinica }] = await Promise.all([
      admin.from("leads_clinica").select("token").eq("id", params.leadId).maybeSingle(),
      admin.from("clinics").select("nombre, email").eq("id", params.clinicId).maybeSingle(),
    ]);
    if (!lead || !clinica?.email) return;

    const enlace = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/leads/${lead.token}`;
    const confirmada = params.tipo === "confirmada" && params.opcion;
    const titulo = confirmada ? "Cita de valoración confirmada" : "El paciente necesita otras fechas";
    const cuerpo = confirmada
      ? `<p>El paciente ha confirmado su valoración para el <strong>${fechaCitaLarga(params.opcion!.fecha)}</strong> (${params.opcion!.modalidad === "videollamada" ? "videollamada" : "en clínica"}).</p>`
      : `<p>Ninguna de las fechas que propusisteis le va bien al paciente. Entrad en el lead y proponed otras.</p>`;

    await enviarEmail({
      to: clinica.email,
      subject: confirmada ? "Cita confirmada · Growwly" : "Proponed otras fechas · Growwly",
      html: plantilla(titulo, cuerpo, enlace, "Ver el lead →"),
    });
  } catch (e) {
    console.error("No se pudo avisar a la clínica de la cita:", e);
  }
}

/** Al paciente: la clínica elegida le propone fechas para la valoración. */
export async function notificarPacienteFechas(
  admin: SupabaseClient<Database>,
  params: { solicitudId: string; clinicId: string },
): Promise<void> {
  try {
    const { data: solicitud } = await admin
      .from("solicitudes_presupuesto")
      .select("id, user_id")
      .eq("id", params.solicitudId)
      .maybeSingle();
    if (!solicitud) return;

    const [{ data: perfil }, { data: clinica }] = await Promise.all([
      admin.from("profiles").select("nombre, email").eq("id", solicitud.user_id).maybeSingle(),
      admin.from("clinics").select("nombre").eq("id", params.clinicId).maybeSingle(),
    ]);
    if (!perfil?.email) return;

    const enlace = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/cuenta/solicitud/${solicitud.id}`;
    await enviarEmail({
      to: perfil.email,
      subject: "Elige fecha para tu valoración · Growwly",
      html: plantilla(
        "Elige fecha para tu valoración",
        `<p>Hola${perfil.nombre ? ` ${perfil.nombre}` : ""},</p><p><strong>${clinica?.nombre ?? "La clínica"}</strong> te propone varias fechas. Solo tienes que confirmar la que mejor te venga.</p>`,
        enlace,
        "Elegir fecha →",
      ),
    });
  } catch (e) {
    console.error("No se pudo avisar al paciente de las fechas:", e);
  }
}
