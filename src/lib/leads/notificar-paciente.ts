import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { enviarEmail } from "@/lib/email/resend";

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
  return `
    <div style="font-family: Arial, sans-serif; color: #33403f; max-width: 480px; margin: 0 auto;">
      <p style="color: #00768f; font-weight: bold; letter-spacing: 0.05em; text-transform: uppercase; font-size: 12px;">Growwly</p>
      <h1 style="font-size: 20px; color: #00566b;">Has recibido un presupuesto</h1>
      <p>Hola${datos.nombrePaciente ? ` ${datos.nombrePaciente}` : ""},</p>
      <p><strong>${datos.nombreClinica}</strong> te ha enviado una propuesta para tu solicitud. Échale un vistazo y compárala con el resto antes de elegir.</p>
      <p style="margin-top: 24px;">
        <a href="${datos.enlace}" style="background:#00c2d6; color:#fff; padding:12px 20px; border-radius:8px; text-decoration:none; font-weight:bold; display:inline-block;">
          Ver mi propuesta →
        </a>
      </p>
      <p style="font-size: 12px; color: #66756f; margin-top: 24px;">
        Este email lo has recibido porque pediste presupuesto a través de Growwly.
      </p>
    </div>
  `;
}
