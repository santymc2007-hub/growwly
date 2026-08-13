"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

type Tipo = "destacado" | "destacado_home" | "destacado_ciudad" | "premium";

export async function aprobarSolicitud(clinicId: string, tipo: Tipo) {
  const supabase = createAdminClient();

  if (tipo === "premium") {
    await supabase
      .from("clinics")
      .update({ plan: "premium", plan_solicitado: null })
      .eq("id", clinicId);
  } else if (tipo === "destacado") {
    await supabase
      .from("clinics")
      .update({ destacado: true, destacado_solicitado: false })
      .eq("id", clinicId);
  } else if (tipo === "destacado_home") {
    await supabase
      .from("clinics")
      .update({ destacado_home: true, destacado_home_solicitado: false })
      .eq("id", clinicId);
  } else {
    await supabase
      .from("clinics")
      .update({ destacado_ciudad: true, destacado_ciudad_solicitado: false })
      .eq("id", clinicId);
  }

  revalidatePath("/admin/solicitudes");
  revalidatePath("/admin/clinicas");
  revalidatePath("/clinicas");
}

export async function rechazarSolicitud(clinicId: string, tipo: Tipo) {
  const supabase = createAdminClient();

  if (tipo === "premium") {
    await supabase.from("clinics").update({ plan_solicitado: null }).eq("id", clinicId);
  } else if (tipo === "destacado") {
    await supabase
      .from("clinics")
      .update({ destacado_solicitado: false })
      .eq("id", clinicId);
  } else if (tipo === "destacado_home") {
    await supabase
      .from("clinics")
      .update({ destacado_home_solicitado: false })
      .eq("id", clinicId);
  } else {
    await supabase
      .from("clinics")
      .update({ destacado_ciudad_solicitado: false })
      .eq("id", clinicId);
  }

  revalidatePath("/admin/solicitudes");
  revalidatePath("/admin/clinicas");
}
