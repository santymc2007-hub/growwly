"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireClinicaActiva } from "@/lib/clinica/contexto-activo";

export type TipoVisibilidad =
  | "destacado"
  | "destacado_home"
  | "destacado_ciudad"
  | "premium";

type FechasVisibilidad = Record<
  string,
  {
    meses_solicitados?: number | null;
    activado_en?: string;
    expira_en?: string | null;
  }
>;

/**
 * La clínica pide un tipo de visibilidad, indicando cuánto tiempo le
 * gustaría tenerlo activo (o null = indefinido). Queda pendiente de que
 * el admin lo apruebe desde /admin/visibilidad, donde verá esta
 * duración como sugerencia (puede respetarla o cambiarla).
 */
export async function solicitarVisibilidad(
  tipo: TipoVisibilidad,
  meses: number | null,
) {
  const { clinicId } = await requireClinicaActiva();
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("clinics")
    .select("visibilidad_fechas")
    .eq("id", clinicId)
    .maybeSingle();
  const fechas: FechasVisibilidad =
    data?.visibilidad_fechas &&
    typeof data.visibilidad_fechas === "object" &&
    !Array.isArray(data.visibilidad_fechas)
      ? (data.visibilidad_fechas as FechasVisibilidad)
      : {};
  fechas[tipo] = { ...fechas[tipo], meses_solicitados: meses };

  if (tipo === "premium") {
    await supabase
      .from("clinics")
      .update({ plan_solicitado: "premium", visibilidad_fechas: fechas })
      .eq("id", clinicId);
  } else if (tipo === "destacado") {
    await supabase
      .from("clinics")
      .update({ destacado_solicitado: true, visibilidad_fechas: fechas })
      .eq("id", clinicId);
  } else if (tipo === "destacado_home") {
    await supabase
      .from("clinics")
      .update({ destacado_home_solicitado: true, visibilidad_fechas: fechas })
      .eq("id", clinicId);
  } else {
    await supabase
      .from("clinics")
      .update({ destacado_ciudad_solicitado: true, visibilidad_fechas: fechas })
      .eq("id", clinicId);
  }

  revalidatePath("/clinica/visibilidad");
  redirect("/clinica/visibilidad?solicitud=1");
}
