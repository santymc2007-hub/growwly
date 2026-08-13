import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const COOKIE_CLINICA_ACTIVA = "clinica_activa_id";

export type ClinicaDisponible = {
  id: string;
  nombre: string;
  logo_url: string | null;
};

/**
 * Comprueba que hay una cuenta de clínica aprobada, y resuelve CUÁL de
 * sus clínicas (puede tener varias, si forma parte de un grupo) es la
 * "activa" ahora mismo — guardada en una cookie, para que cambiar de
 * clínica en el selector no dependa de recargar sesión.
 */
export async function requireClinicaActiva(): Promise<{
  clinicId: string;
  profileId: string;
  clinicas: ClinicaDisponible[];
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/clinica/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, clinic_status")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "clinic" || profile.clinic_status !== "aprobado") {
    redirect("/clinica");
  }

  const admin = createAdminClient();
  const { data: miembros } = await admin
    .from("clinic_members")
    .select("clinic_id")
    .eq("profile_id", user.id);

  const clinicIds = (miembros ?? []).map((m) => m.clinic_id);
  if (clinicIds.length === 0) redirect("/clinica");

  const { data: clinicasData } = await admin
    .from("clinics")
    .select("id, nombre, logo_url")
    .in("id", clinicIds)
    .order("nombre", { ascending: true });

  const clinicas: ClinicaDisponible[] = clinicasData ?? [];
  if (clinicas.length === 0) redirect("/clinica");

  const cookieStore = await cookies();
  const activaCookie = cookieStore.get(COOKIE_CLINICA_ACTIVA)?.value;
  const activa = clinicas.find((c) => c.id === activaCookie) ?? clinicas[0];

  return { clinicId: activa.id, profileId: user.id, clinicas };
}
