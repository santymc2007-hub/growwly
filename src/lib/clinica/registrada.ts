import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Una clínica está "registrada" cuando algún perfil tiene cuenta
 * aprobada para gestionarla — no basta con que exista en el
 * directorio. Mismo criterio que usa /clinica/registro y
 * vincular-clinica.ts para decidir si una ficha ya tiene dueño.
 */
export async function clinicaEstaRegistrada(
  supabaseAdmin: SupabaseClient<Database>,
  clinicId: string,
): Promise<boolean> {
  const { count } = await supabaseAdmin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("clinic_id", clinicId)
    .eq("clinic_status", "aprobado");

  return (count ?? 0) > 0;
}
