import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Condiciones que acepta cada clínica sobre los datos de pacientes que
 * recibe por Growwly. Se piden en el panel antes de ver la primera
 * solicitud con datos (el plan de pago se contrata fuera de la web).
 *
 * Texto provisional, pendiente de revisión por el abogado (pregunta 4
 * de la consulta legal, oct 2026). Si cambia el texto, cambiar también
 * la versión: se volverá a pedir a todas las clínicas.
 */
export const VERSION_CONDICIONES_DATOS = "2026-10-19";

export const CONDICIONES_DATOS: string[] = [
  "Mi clínica es responsable independiente de los datos de cada paciente que recibe a través de Growwly, incluidos los datos de salud.",
  "Solo los usaremos para responder a la solicitud del paciente y, si sigue adelante con nosotros, para atenderle.",
  "Los trataremos con secreto profesional y con las medidas de seguridad que exige la normativa sanitaria y de protección de datos.",
  "No los cederemos a terceros ni los usaremos para enviar publicidad sin su consentimiento.",
  "Si el paciente no sigue adelante con nuestra clínica, borraremos sus datos.",
];

type Admin = SupabaseClient<Database>;

/** true si la clínica aceptó la versión vigente de las condiciones. */
export async function clinicaAceptoCondicionesDatos(
  admin: Admin,
  clinicId: string,
): Promise<boolean> {
  const { data } = await admin
    .from("clinic_privado")
    .select("condiciones_datos_en, condiciones_datos_version")
    .eq("clinic_id", clinicId)
    .maybeSingle();
  return Boolean(
    data?.condiciones_datos_en && data.condiciones_datos_version === VERSION_CONDICIONES_DATOS,
  );
}

/** Ruta a la pantalla de aceptación, con vuelta a donde iba la clínica. */
export function rutaCondicionesDatos(clinicId: string, next: string): string {
  return `/clinica/condiciones-datos?clinic=${encodeURIComponent(clinicId)}&next=${encodeURIComponent(next)}`;
}

/** Solo rutas internas conocidas como destino tras aceptar. */
export function destinoTrasCondiciones(next: string | null | undefined): string {
  if (next && /^\/leads\/[0-9a-f-]{36}(\/valoracion)?$/i.test(next)) return next;
  return "/clinica/solicitudes";
}
