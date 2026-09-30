import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type SuperficieListado =
  | "listado"
  | "ciudad"
  | "home_destacadas"
  | "home_semana"
  | "tratamiento";

/**
 * Registra una impresión por cada clínica cuya tarjeta se ha
 * renderizado en un listado — el paso del embudo anterior a la vista
 * de ficha (clinic_page_views). Se llama desde after() para no
 * retrasar la respuesta, igual que el resto de registro propio.
 */
export async function registrarImpresionesListado(
  admin: SupabaseClient<Database>,
  clinicIds: string[],
  superficie: SuperficieListado,
): Promise<void> {
  if (clinicIds.length === 0) return;
  await admin
    .from("clinic_impresiones_listado")
    .insert(clinicIds.map((clinic_id) => ({ clinic_id, superficie })));
}
