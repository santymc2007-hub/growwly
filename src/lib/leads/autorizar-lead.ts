import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  clinicaAceptoCondicionesDatos,
  rutaCondicionesDatos,
} from "@/lib/clinica/condiciones-datos";

/**
 * Los datos de un lead (historial capilar, medicación, fotos…) son
 * datos de salud. Antes bastaba con tener el enlace del email
 * (/leads/<token>); desde oct 2026 (decisión de Santy, opción B de la
 * auditoría) además hay que haber iniciado sesión como gestor aprobado
 * de ESA clínica, o como admin. La clínica, además, tiene que haber
 * aceptado las condiciones sobre datos de pacientes
 * (lib/clinica/condiciones-datos.ts).
 *
 * Va al principio de la página del lead, de la valoración y de cada
 * acción sobre el lead. Fuera de cualquier try/catch: redirect() y
 * notFound() funcionan lanzando una excepción.
 */
export async function autorizarAccesoLead(token: string): Promise<{ clinicId: string }> {
  const admin = createAdminClient();

  const { data: lead } = await admin
    .from("leads_clinica")
    .select("clinic_id")
    .eq("token", token)
    .maybeSingle();

  if (!lead) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/clinica/login?next=${encodeURIComponent(`/leads/${token}`)}`);
  }

  const { data: perfil } = await admin
    .from("profiles")
    .select("role, clinic_status")
    .eq("id", user.id)
    .maybeSingle();

  if (perfil?.role === "admin") return { clinicId: lead.clinic_id };

  if (perfil?.role === "clinic" && perfil.clinic_status === "aprobado") {
    const { data: miembro } = await admin
      .from("clinic_members")
      .select("clinic_id")
      .eq("profile_id", user.id)
      .eq("clinic_id", lead.clinic_id)
      .maybeSingle();
    if (miembro) {
      // Antes de ver datos de pacientes, la clínica acepta ser
      // responsable de ellos (consulta legal, oct 2026).
      if (!(await clinicaAceptoCondicionesDatos(admin, lead.clinic_id))) {
        redirect(rutaCondicionesDatos(lead.clinic_id, `/leads/${token}`));
      }
      return { clinicId: lead.clinic_id };
    }
  }

  redirect(
    `/clinica?error=${encodeURIComponent(
      "Esta solicitud es de otra clínica. Inicia sesión con la cuenta de la clínica que la recibió.",
    )}`,
  );
}

/** Solo rutas internas de leads: evita redirecciones abiertas tras el login. */
export function destinoTrasLogin(next: string | null | undefined): string | null {
  if (!next) return null;
  if (next === "/clinica/visibilidad") return next;
  return /^\/leads\/[0-9a-f-]{36}(\/valoracion)?$/i.test(next) ? next : null;
}
