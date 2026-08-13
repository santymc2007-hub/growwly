"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarEmail } from "@/lib/email/resend";

/**
 * Añade una clínica más a una cuenta ya aprobada — así se forman los
 * grupos (una cuenta gestionando varias fichas). A diferencia del
 * primer vínculo (que hace vincularClinica en el registro), esto NO
 * comprueba si la clínica ya tiene otra cuenta aprobada — es el admin
 * quien decide deliberadamente montar el grupo.
 */
export async function anadirClinicaAlGrupo(
  profileId: string,
  formData: FormData,
) {
  const clinicId = String(formData.get("clinicId") ?? "");
  if (!clinicId) return;
  const supabase = createAdminClient();

  await supabase
    .from("clinic_members")
    .upsert({ profile_id: profileId, clinic_id: clinicId }, { onConflict: "profile_id,clinic_id" });

  revalidatePath("/admin/clinicas-cuentas");
}

export async function quitarClinicaDelGrupo(
  profileId: string,
  clinicId: string,
) {
  const supabase = createAdminClient();

  await supabase
    .from("clinic_members")
    .delete()
    .eq("profile_id", profileId)
    .eq("clinic_id", clinicId);

  revalidatePath("/admin/clinicas-cuentas");
}

export async function aprobarCuentaClinica(profileId: string) {
  const supabase = createAdminClient();

  const { data: perfil } = await supabase
    .from("profiles")
    .select("email, clinic_id")
    .eq("id", profileId)
    .maybeSingle();

  await supabase
    .from("profiles")
    .update({ clinic_status: "aprobado" })
    .eq("id", profileId);

  if (perfil?.email) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    try {
      await enviarEmail({
        to: perfil.email,
        subject: "Tu cuenta de clínica en Growwly ya está activa",
        html: `
          <div style="font-family: Arial, sans-serif; color: #33403f; max-width: 480px; margin: 0 auto;">
            <p style="color: #00768f; font-weight: bold; letter-spacing: 0.05em; text-transform: uppercase; font-size: 12px;">Growwly</p>
            <h1 style="font-size: 20px; color: #00566b;">¡Tu cuenta ya está activa!</h1>
            <p>Hemos aprobado tu acceso. Ya puedes entrar a tu panel para ver y responder a las solicitudes de presupuesto de tu clínica.</p>
            <p style="margin-top: 24px;">
              <a href="${siteUrl}/clinica/login" style="background:#00c2d6; color:#fff; padding:12px 20px; border-radius:8px; text-decoration:none; font-weight:bold; display:inline-block;">
                Entrar a mi panel →
              </a>
            </p>
          </div>
        `,
      });
    } catch {
      // No bloqueamos la aprobación si falla el email — la cuenta ya
      // queda aprobada igualmente.
    }
  }

  revalidatePath("/admin/clinicas-cuentas");
}

export async function rechazarCuentaClinica(profileId: string) {
  const supabase = createAdminClient();
  await supabase
    .from("profiles")
    .update({ role: "patient", clinic_id: null, clinic_status: null })
    .eq("id", profileId);

  revalidatePath("/admin/clinicas-cuentas");
}
