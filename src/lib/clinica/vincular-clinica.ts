import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Vincula un perfil a una clínica del directorio, con estado
 * "pendiente" hasta que el admin lo apruebe. Solo vincula si esa
 * clínica todavía no tiene una cuenta aprobada (para que dos personas
 * no puedan reclamar la misma clínica a la vez sin control).
 */
export async function vincularClinica(
  userId: string,
  clinicId: string,
): Promise<boolean> {
  const supabase = createAdminClient();

  const { data: yaAprobada } = await supabase
    .from("profiles")
    .select("id")
    .eq("clinic_id", clinicId)
    .eq("clinic_status", "aprobado")
    .maybeSingle();

  if (yaAprobada) return false;

  const { error } = await supabase
    .from("profiles")
    .update({ role: "clinic", clinic_id: clinicId, clinic_status: "pendiente" })
    .eq("id", userId);

  return !error;
}
