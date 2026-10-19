import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { crearSolicitudCitaDirecta } from "@/lib/leads/crear-solicitud-cita-directa";

type Admin = SupabaseClient<Database>;

export type DatosAlternativa = {
  clinicaNombre: string;
  clinicaOriginalNombre: string | null;
  yaEnviada: boolean;
};

/**
 * Lo que necesita la pantalla de confirmación del enlace "Enviarles mi
 * solicitud" (email de clínicas alternativas). Solo lee: abrir el
 * enlace no envía nada.
 */
export async function leerAlternativa(
  admin: Admin,
  token: string,
): Promise<DatosAlternativa | null> {
  const { data: alternativa } = await admin
    .from("solicitudes_cita_directa_alternativas")
    .select("solicitud_id, clinic_id, enviada_en")
    .eq("token", token)
    .maybeSingle();
  if (!alternativa) return null;

  const [{ data: clinica }, { data: original }] = await Promise.all([
    admin.from("clinics").select("nombre").eq("id", alternativa.clinic_id).maybeSingle(),
    admin
      .from("solicitudes_cita_directa")
      .select("clinic_id")
      .eq("id", alternativa.solicitud_id)
      .maybeSingle(),
  ]);
  if (!clinica || !original) return null;

  const { data: clinicaOriginal } = await admin
    .from("clinics")
    .select("nombre")
    .eq("id", original.clinic_id)
    .maybeSingle();

  return {
    clinicaNombre: clinica.nombre,
    clinicaOriginalNombre: clinicaOriginal?.nombre ?? null,
    yaEnviada: Boolean(alternativa.enviada_en),
  };
}

export type ResultadoReenvio =
  | { estado: "enviada"; clinicaNombre: string }
  | { estado: "ya" | "invalido" | "error" };

/**
 * Envía a la clínica alternativa la misma solicitud que el paciente
 * mandó a la original. Se llama solo al pulsar el botón de la pantalla
 * de confirmación (POST): los antivirus de correo abren los enlaces de
 * los emails, y con un GET la solicitud salía sin que el paciente lo
 * pidiera (auditoría, oct 2026).
 *
 * El token se marca como usado antes de enviar y solo si seguía libre,
 * para que dos clics seguidos no manden la solicitud dos veces.
 */
export async function reenviarAAlternativa(
  admin: Admin,
  token: string,
): Promise<ResultadoReenvio> {
  const { data: reclamada } = await admin
    .from("solicitudes_cita_directa_alternativas")
    .update({ enviada_en: new Date().toISOString() })
    .eq("token", token)
    .is("enviada_en", null)
    .select("solicitud_id, clinic_id")
    .maybeSingle();

  if (!reclamada) {
    const { data: existe } = await admin
      .from("solicitudes_cita_directa_alternativas")
      .select("id")
      .eq("token", token)
      .maybeSingle();
    return { estado: existe ? "ya" : "invalido" };
  }

  const [{ data: original }, { data: clinica }] = await Promise.all([
    admin
      .from("solicitudes_cita_directa")
      .select("nombre, telefono, email, mensaje, consentimiento_en, consentimiento_version")
      .eq("id", reclamada.solicitud_id)
      .maybeSingle(),
    admin.from("clinics").select("nombre").eq("id", reclamada.clinic_id).maybeSingle(),
  ]);

  if (!original) return { estado: "invalido" };

  const resultado = await crearSolicitudCitaDirecta(admin, {
    clinicId: reclamada.clinic_id,
    nombre: original.nombre,
    telefono: original.telefono,
    email: original.email ?? "",
    mensaje: original.mensaje ?? "",
    // El paciente confirma el reenvío en la pantalla de confirmación;
    // el consentimiento de datos es el de su solicitud original.
    consentimientoEn: original.consentimiento_en,
    consentimientoVersion: original.consentimiento_version,
  });

  if (!resultado.ok) return { estado: "error" };
  return { estado: "enviada", clinicaNombre: clinica?.nombre ?? "" };
}
