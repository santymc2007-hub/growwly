"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireClinicaAprobada(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/clinica/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, clinic_id, clinic_status")
    .eq("id", user.id)
    .maybeSingle();

  if (
    !profile ||
    profile.role !== "clinic" ||
    profile.clinic_status !== "aprobado" ||
    !profile.clinic_id
  ) {
    redirect("/clinica");
  }

  return profile.clinic_id;
}

export async function guardarDatosFacturacion(formData: FormData) {
  const clinicId = await requireClinicaAprobada();
  const supabase = createAdminClient();

  const datos = {
    titular: String(formData.get("titular") ?? "").trim() || null,
    nif_cif: String(formData.get("nif_cif") ?? "").trim() || null,
    email_facturacion:
      String(formData.get("email_facturacion") ?? "").trim() || null,
  };

  await supabase
    .from("clinics")
    .update({ datos_facturacion: datos })
    .eq("id", clinicId);

  revalidatePath("/clinica/facturacion");
  redirect("/clinica/facturacion?guardado=1");
}
