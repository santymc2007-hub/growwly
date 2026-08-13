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

  await supabase
    .from("clinics")
    .update({ datos_facturacion: datos })
    .eq("id", clinicId);

  revalidatePath("/clinica/facturacion");
  redirect("/clinica/facturacion?guardado=1");
}
