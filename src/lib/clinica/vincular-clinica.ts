import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { avisarAltaClinica } from "@/lib/email/aviso-santy";

/**
 * Vincula un perfil a una clínica del directorio, con estado
 * "pendiente" hasta que el admin lo apruebe. Solo vincula si esa
 * clínica todavía no tiene una cuenta aprobada (para que dos personas
 * no puedan reclamar la misma clínica a la vez sin control).
 *
 * Autoaprobación: solo cuando la clínica la acaba de crear ESTA
 * persona desde /clinica/registro ("mi clínica no está"). Se comprueba
 * en el servidor: el email con el que se dio de alta la clínica
 * (clinic_privado.alta_email) tiene que coincidir con el del usuario,
 * y la clínica no puede tener ya ningún miembro. Antes se fiaba de un
 * `?nueva=1` en la URL, y cualquiera con sesión podía quedarse con
 * cualquier clínica (auditoría de seguridad, oct 2026).
 *
 * Lo que sigue bloqueado hasta que admin lo confirme es que la ficha
 * se vea en la web (columna `verificado_admin` en `clinics`).
 */
export async function vincularClinica(
  userId: string,
  clinicId: string,
  nombreGestor?: string | null,
  opciones?: { emailUsuario?: string | null },
): Promise<boolean> {
  const supabase = createAdminClient();

  const { data: perfil } = await supabase
    .from("profiles")
    .select("role, clinic_id, clinic_status, email")
    .eq("id", userId)
    .maybeSingle();

  // Un admin nunca se convierte en cuenta de clínica por abrir un enlace.
  if (!perfil || perfil.role === "admin") return false;

  const { data: yaAprobada } = await supabase
    .from("profiles")
    .select("id")
    .eq("clinic_id", clinicId)
    .eq("clinic_status", "aprobado")
    .maybeSingle();

  if (yaAprobada) return false;

  const autoAprobar = await esCreadorDeClinicaNueva(clinicId, opciones?.emailUsuario);

  const { error } = await supabase
    .from("profiles")
    .update({
      role: "clinic",
      clinic_id: clinicId,
      clinic_status: autoAprobar ? "aprobado" : "pendiente",
      ...(nombreGestor ? { nombre: nombreGestor.slice(0, 120) } : {}),
    })
    .eq("id", userId);

  if (error) return false;

  if (autoAprobar) {
    // Se consume: el mismo email no sirve para autoaprobarse otra vez.
    await supabase.from("clinic_privado").update({ alta_email: null }).eq("clinic_id", clinicId);
  }

  // clinic_members es lo que de verdad da acceso al panel — y
  // requireClinicaActiva() además exige clinic_status = "aprobado".
  // profiles.clinic_id se mantiene solo como referencia de "cuál fue
  // la primera".
  await supabase
    .from("clinic_members")
    .upsert({ profile_id: userId, clinic_id: clinicId }, { onConflict: "profile_id,clinic_id" });

  // Aviso a Santy, solo la primera vez (abrir el enlace otra vez no
  // vuelve a avisar).
  if (perfil.clinic_id !== clinicId) {
    after(() =>
      avisarAltaClinica({
        clinicId,
        autoaprobada: autoAprobar,
        gestor: nombreGestor ?? null,
        email: opciones?.emailUsuario ?? perfil.email ?? null,
      }),
    );
  }

  return true;
}

async function esCreadorDeClinicaNueva(
  clinicId: string,
  emailUsuario: string | null | undefined,
): Promise<boolean> {
  if (!emailUsuario) return false;
  const supabase = createAdminClient();

  const { data: privado } = await supabase
    .from("clinic_privado")
    .select("alta_email")
    .eq("clinic_id", clinicId)
    .maybeSingle();

  if (!privado?.alta_email) return false;
  if (privado.alta_email.toLowerCase() !== emailUsuario.trim().toLowerCase()) return false;

  const { count } = await supabase
    .from("clinic_members")
    .select("clinic_id", { count: "exact", head: true })
    .eq("clinic_id", clinicId);

  return (count ?? 0) === 0;
}
