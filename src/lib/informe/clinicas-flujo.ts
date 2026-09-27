import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { CONTENIDO_FLUJOS } from "./flujos";
import type { Flujo } from "./tipos";

/**
 * Cuántas clínicas de Growwly tratan este tipo de caso. No es un Match
 * Score: el match real necesita los datos del formulario de presupuesto
 * (ciudad, tratamiento que interesa, presupuesto…), que el paciente
 * rellena DESPUÉS de ver el informe.
 *
 * Usa el mismo filtro de clínicas que el reparto real de leads
 * (publicada + verificada + plan premium), para no contar clínicas que
 * luego no van a recibir la solicitud.
 */
export async function contarClinicasParaFlujo(
  supabase: SupabaseClient<Database>,
  flujo: Flujo,
): Promise<number> {
  const { count } = await supabase
    .from("clinics")
    .select("id", { count: "exact", head: true })
    .eq("publicado", true)
    .eq("verificado_admin", true)
    .eq("plan", "premium")
    .overlaps("tecnicas", CONTENIDO_FLUJOS[flujo].tecnicas);

  return count ?? 0;
}
