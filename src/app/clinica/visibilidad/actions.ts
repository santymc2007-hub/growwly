"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { avisarSolicitudVisibilidad } from "@/lib/email/aviso-santy";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireClinicaActiva } from "@/lib/clinica/contexto-activo";
import {
  camposDestacado,
  plazasDestacado,
  type TipoVisibilidad,
} from "@/lib/visibilidad/destacados";

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
 *
 * Los destacados tienen plazas limitadas (8 generales, 8 por
 * provincia): si no queda ninguna, no se puede pedir.
 */
export async function solicitarVisibilidad(
  tipo: TipoVisibilidad,
  meses: number | null,
) {
  const { clinicId } = await requireClinicaActiva();
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("clinics")
    .select("visibilidad_fechas, provincia")
    .eq("id", clinicId)
    .maybeSingle();

  if (tipo !== "premium") {
    const plazas = await plazasDestacado(supabase, tipo, data?.provincia ?? null);
    if (plazas.libres === 0) {
      redirect("/clinica/visibilidad?completo=1");
    }
  }

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
  } else {
    await supabase
      .from("clinics")
      .update({ ...camposDestacado(tipo, { solicitado: true }), visibilidad_fechas: fechas })
      .eq("id", clinicId);
  }

  after(() => avisarSolicitudVisibilidad({ clinicId, tipo, meses }));

  revalidatePath("/clinica/visibilidad");
  redirect("/clinica/visibilidad?solicitud=1");
}
