import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Solicitudes de presupuesto que le han llegado a esta clínica y que
 * todavía no ha desbloqueado — para el aviso en la pestaña y el modal
 * de bienvenida al panel.
 */
export async function contarSolicitudesPendientes(
  clinicId: string,
): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("leads_clinica")
    .select("id", { count: "exact", head: true })
    .eq("clinic_id", clinicId)
    .eq("estado", "enviado");

  return count ?? 0;
}
