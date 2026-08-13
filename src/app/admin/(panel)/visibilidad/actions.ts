"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type TipoVisibilidad =
  | "destacado"
  | "destacado_home"
  | "destacado_ciudad"
  | "premium";

type FechasVisibilidad = Record<
  string,
  { activado_en: string; expira_en: string | null }
>;

function revalidarTodo() {
  revalidatePath("/admin/visibilidad");
  revalidatePath("/admin/clinicas");
  revalidatePath("/clinicas");
  revalidatePath("/");
}

async function leerFechas(
  supabase: ReturnType<typeof createAdminClient>,
  clinicId: string,
): Promise<FechasVisibilidad> {
  const { data } = await supabase
    .from("clinics")
    .select("visibilidad_fechas")
    .eq("id", clinicId)
    .maybeSingle();
  const fechas = data?.visibilidad_fechas;
  return fechas && typeof fechas === "object" && !Array.isArray(fechas)
    ? (fechas as FechasVisibilidad)
    : {};
}

/**
 * Activa un tipo de visibilidad con una duración concreta (o
 * indefinida si mesesDuracion es null), aprobando la solicitud si la
 * había. Guarda cuándo se activó y cuándo caduca, para poder facturar
 * por días activos y para que se desactive sola al llegar la fecha
 * (ver /api/cron/expirar-visibilidad).
 */
export async function activarVisibilidad(
  clinicId: string,
  tipo: TipoVisibilidad,
  mesesDuracion: number | null,
) {
  const supabase = createAdminClient();

  const ahora = new Date();
  const expira = mesesDuracion
    ? new Date(ahora.getFullYear(), ahora.getMonth() + mesesDuracion, ahora.getDate())
    : null;

  const fechas = await leerFechas(supabase, clinicId);
  fechas[tipo] = {
    activado_en: ahora.toISOString(),
    expira_en: expira ? expira.toISOString() : null,
  };

  const camposBase = { visibilidad_fechas: fechas };

  if (tipo === "premium") {
    await supabase
      .from("clinics")
      .update({ ...camposBase, plan: "premium", plan_solicitado: null })
      .eq("id", clinicId);
  } else if (tipo === "destacado") {
    await supabase
      .from("clinics")
      .update({ ...camposBase, destacado: true, destacado_solicitado: false })
      .eq("id", clinicId);
  } else if (tipo === "destacado_home") {
    await supabase
      .from("clinics")
      .update({ ...camposBase, destacado_home: true, destacado_home_solicitado: false })
      .eq("id", clinicId);
  } else {
    await supabase
      .from("clinics")
      .update({
        ...camposBase,
        destacado_ciudad: true,
        destacado_ciudad_solicitado: false,
      })
      .eq("id", clinicId);
  }

  revalidarTodo();
}

/** Desactiva directamente y limpia sus fechas. */
export async function desactivarVisibilidad(
  clinicId: string,
  tipo: TipoVisibilidad,
) {
  const supabase = createAdminClient();

  const fechas = await leerFechas(supabase, clinicId);
  delete fechas[tipo];
  const camposBase = { visibilidad_fechas: fechas };

  if (tipo === "premium") {
    await supabase
      .from("clinics")
      .update({ ...camposBase, plan: "basico", plan_solicitado: null })
      .eq("id", clinicId);
  } else if (tipo === "destacado") {
    await supabase
      .from("clinics")
      .update({ ...camposBase, destacado: false, destacado_solicitado: false })
      .eq("id", clinicId);
  } else if (tipo === "destacado_home") {
    await supabase
      .from("clinics")
      .update({ ...camposBase, destacado_home: false, destacado_home_solicitado: false })
      .eq("id", clinicId);
  } else {
    await supabase
      .from("clinics")
      .update({
        ...camposBase,
        destacado_ciudad: false,
        destacado_ciudad_solicitado: false,
      })
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
