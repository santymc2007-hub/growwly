"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { verificarBajaReclamo } from "@/lib/email/reclamo-centro";

export async function confirmarBajaCentro(formData: FormData) {
  const c = String(formData.get("c") ?? "");
  const t = String(formData.get("t") ?? "");
  if (!verificarBajaReclamo(c, t)) redirect("/emails/baja-centro?estado=invalido");

  await createAdminClient()
    .from("clinic_avisos_reclamo")
    .upsert({ clinic_id: c, baja_en: new Date().toISOString() }, { onConflict: "clinic_id" });

  redirect("/emails/baja-centro?estado=hecho");
}
