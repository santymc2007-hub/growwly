"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireClinicaActiva } from "@/lib/clinica/contexto-activo";

export async function guardarDatosFacturacion(formData: FormData) {
  const { clinicId } = await requireClinicaActiva();
  const supabase = createAdminClient();

  const datos = {
    titular: String(formData.get("titular") ?? "").trim() || null,
    nif_cif: String(formData.get("nif_cif") ?? "").trim() || null,
    email_facturacion:
      String(formData.get("email_facturacion") ?? "").trim() || null,
  };

  // Va a clinic_privado (solo servidor), no a clinics: clinics es
  // legible por cualquiera con la clave pública.
  await supabase
    .from("clinic_privado")
    .upsert(
      { clinic_id: clinicId, datos_facturacion: datos, updated_at: new Date().toISOString() },
      { onConflict: "clinic_id" },
    );

  revalidatePath("/clinica/facturacion");
  redirect("/clinica/facturacion?guardado=1");
}
