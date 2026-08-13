"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type TipoVisibilidad =
  | "destacado"
  | "destacado_home"
  | "destacado_ciudad"
  | "premium";

function revalidarTodo() {
  revalidatePath("/admin/visibilidad");
  revalidatePath("/admin/clinicas");
  revalidatePath("/clinicas");
  revalidatePath("/");
}

/** Activa (aprobando la solicitud si la había) o desactiva directamente. */
export async function alternarVisibilidad(
  clinicId: string,
  tipo: TipoVisibilidad,
  activar: boolean,
) {
  const supabase = createAdminClient();

  if (tipo === "premium") {
    await supabase
      .from("clinics")
      .update({
        plan: activar ? "premium" : "basico",
        plan_solicitado: null,
      })
      .eq("id", clinicId);
  } else if (tipo === "destacado") {
    await supabase
      .from("clinics")
      .update({ destacado: activar, destacado_solicitado: false })
      .eq("id", clinicId);
  } else if (tipo === "destacado_home") {
    await supabase
      .from("clinics")
      .update({ destacado_home: activar, destacado_home_solicitado: false })
      .eq("id", clinicId);
  } else {
    await supabase
      .from("clinics")
      .update({ destacado_ciudad: activar, destacado_ciudad_solicitado: false })
      .eq("id", clinicId);
  }

  revalidarTodo();
}

/** Rechaza una solicitud pendiente sin activar nada. */
export async function rechazarVisibilidad(
  clinicId: string,
  tipo: TipoVisibilidad,
) {
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

  revalidarTodo();
}
