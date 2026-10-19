"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireClinicaActiva } from "@/lib/clinica/contexto-activo";
import {
  VERSION_CONDICIONES_DATOS,
  destinoTrasCondiciones,
} from "@/lib/clinica/condiciones-datos";

export async function aceptarCondicionesDatos(formData: FormData) {
  const { clinicId: activa, profileId, clinicas } = await requireClinicaActiva();
  const pedida = String(formData.get("clinic") ?? "");
  // Solo una clínica de la que es miembro; si no, la activa.
  const clinicId = clinicas.some((c) => c.id === pedida) ? pedida : activa;
  const next = String(formData.get("next") ?? "");

  if (formData.get("acepto") !== "on") {
    redirect(
      `/clinica/condiciones-datos?clinic=${encodeURIComponent(clinicId)}&next=${encodeURIComponent(next)}&error=1`,
    );
  }

  const ahora = new Date().toISOString();
  await createAdminClient()
    .from("clinic_privado")
    .upsert(
      {
        clinic_id: clinicId,
        condiciones_datos_en: ahora,
        condiciones_datos_version: VERSION_CONDICIONES_DATOS,
        condiciones_datos_por: profileId,
        updated_at: ahora,
      },
      { onConflict: "clinic_id" },
    );

  redirect(destinoTrasCondiciones(next));
}
