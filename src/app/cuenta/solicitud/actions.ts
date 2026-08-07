"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type DatosSolicitud = {
  estudioId: string | null;
  progresionPerdida: string;
  antecedentesFamiliares: string;
  medicacionActual: string;
  tratamientosInteres: string[];
  dejarDecidirMedico: boolean;
  cuandoTratamiento: string;
  dondeTratamiento: string;
  presupuestoRango: string;
  consentimientoDatos: boolean;
  consentimientoCompartir: boolean;
};

export async function crearSolicitud(
  datos: DatosSolicitud,
): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Tienes que iniciar sesión de nuevo." };
  }

  if (!datos.consentimientoDatos || !datos.consentimientoCompartir) {
    return { error: "Hacen falta los dos consentimientos para continuar." };
  }

  const ahora = new Date().toISOString();

  const { data: solicitud, error } = await supabase
    .from("solicitudes_presupuesto")
    .insert({
      user_id: user.id,
      estudio_id: datos.estudioId,
      progresion_perdida: datos.progresionPerdida || null,
      antecedentes_familiares: datos.antecedentesFamiliares || null,
      medicacion_actual: datos.medicacionActual || null,
      tratamientos_interes: datos.tratamientosInteres,
      dejar_decidir_medico: datos.dejarDecidirMedico,
      cuando_tratamiento: datos.cuandoTratamiento || null,
      donde_tratamiento: datos.dondeTratamiento || null,
      presupuesto_rango: datos.presupuestoRango || null,
      consentimiento_datos_en: ahora,
      consentimiento_compartir_en: ahora,
      estado: "pendiente",
    })
    .select()
    .single();

  if (error || !solicitud) {
    return { error: error?.message ?? "No se pudo crear la solicitud." };
  }

  return { id: solicitud.id };
}

export async function borrarSolicitud(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/cuenta/login");
  }

  await supabase
    .from("solicitudes_presupuesto")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  redirect("/cuenta");
}
