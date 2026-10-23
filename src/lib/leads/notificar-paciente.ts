import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { enviarEmail } from "@/lib/email/resend";
import { esc } from "@/lib/email/escapar";
import { envolverEmail, boton, ESTILO } from "@/lib/email/layout";

/**
 * Avisa al paciente por email cuando una clínica le manda su primera
 * propuesta para una solicitud — el paciente no ve nada en su cuenta
 * hasta que entra, así que sin este aviso podría no enterarse nunca.
 * Un fallo aquí no debe tumbar el guardado de la propuesta (por eso
 * atrapa su propio error, igual que registrarEventoLead).
 */
export async function notificarPacientePropuesta(
  supabaseAdmin: SupabaseClient<Database>,
  params: { solicitudId: string; clinicId: string },
): Promise<void> {
  const { data: solicitud } = await supabaseAdmin
    .from("solicitudes_presupuesto")
    .select("id, user_id")
    .eq("id", params.solicitudId)
    .maybeSingle();

  if (!solicitud) return;

  const [{ data: perfil }, { data: clinica }] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("nombre, email")
      .eq("id", solicitud.user_id)
      .maybeSingle(),
    supabaseAdmin.from("clinics").select("nombre").eq("id", params.clinicId).maybeSingle(),
  ]);

  if (!perfil?.email) return;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const enlace = `${siteUrl}/cuenta/solicitud/${solicitud.id}`;
  const html = construirHtmlEmail({
    nombrePaciente: perfil.nombre,
    nombreClinica: clinica?.nombre ?? "Una clínica",
    enlace,
  });

  try {
    await enviarEmail({
      to: perfil.email,
      subject: "Has recibido un presupuesto en Growwly",
      html,
    });
  } catch (e) {
    console.error("No se pudo avisar al paciente de la nueva propuesta:", e);
  }
}

function construirHtmlEmail(datos: {
  nombrePaciente: string | null;
  nombreClinica: string;
  enlace: string;
}): string {
  return envolverEmail({
    audiencia: "paciente",
    cuerpo: `
      <h1 style="${ESTILO.h1}">Has recibido un presupuesto</h1>
      <p>Hola${datos.nombrePaciente ? ` ${esc(datos.nombrePaciente)}` : ""},</p>
      <p><strong>${esc(datos.nombreClinica)}</strong> te ha enviado una propuesta para tu solicitud. Échale un vistazo y compárala con el resto antes de elegir.</p>
      ${boton(`${datos.enlace}`, `Ver mi propuesta →`)}
      <p style="${ESTILO.nota} margin-top:20px;">
        Este email lo has recibido porque pediste presupuesto a través de Growwly.
      </p>
    `,
  });
}
