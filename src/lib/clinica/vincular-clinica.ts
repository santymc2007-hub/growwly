import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Vincula un perfil a una clínica del directorio, con estado
 * "pendiente" hasta que el admin lo apruebe. Solo vincula si esa
 * clínica todavía no tiene una cuenta aprobada (para que dos personas
 * no puedan reclamar la misma clínica a la vez sin control).
 *
 * `autoAprobar` es para cuando la propia clínica se acaba de crear
 * desde cero (fila nueva en `clinics`, sin dueño previo): ahí no hay
 * disputa de propiedad posible, así que se da acceso al panel — para
 * poder rellenar la ficha — sin esperar a que admin apruebe la
 * cuenta. Lo que SÍ sigue bloqueado hasta que admin lo confirme es
 * que la ficha se vea en la web (columna `verificado_admin` en
 * `clinics`, ajena a esto).
 */
export async function vincularClinica(
  userId: string,
  clinicId: string,
  nombreGestor?: string | null,
  opciones?: { autoAprobar?: boolean },
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
    .update({
      role: "clinic",
      clinic_id: clinicId,
      clinic_status: opciones?.autoAprobar ? "aprobado" : "pendiente",
      ...(nombreGestor ? { nombre: nombreGestor } : {}),
    })
    .eq("id", userId);

  if (error) return false;

  // clinic_members es lo que de verdad da acceso — profiles.clinic_id
  // se mantiene solo como referencia de "cuál fue la primera".
  await supabase
    .from("clinic_members")
    .upsert({ profile_id: userId, clinic_id: clinicId }, { onConflict: "profile_id,clinic_id" });

  return true;
}
