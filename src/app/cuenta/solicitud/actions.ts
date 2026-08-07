"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notificarClinicasDeSolicitud } from "@/lib/leads/notificar-clinicas";

export type DatosSolicitud = {
  estudioId: string | null;
  ciudad: string;
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
      ciudad: datos.ciudad || null,
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

  const supabaseAdmin = createAdminClient();
  try {
    const { candidatas, notificadas, ultimoError } =
      await notificarClinicasDeSolicitud(supabaseAdmin, solicitud.id);
    await supabaseAdmin
      .from("solicitudes_presupuesto")
      .update({
        clinicas_notificadas: notificadas,
        notificacion_error:
          notificadas === 0 && candidatas > 0
            ? (ultimoError ?? "Había clínicas candidatas pero ninguna se pudo avisar.")
            : notificadas === 0 && candidatas === 0
              ? "No se encontró ninguna clínica que encajara con esa ciudad/técnica."
              : null,
      })
      .eq("id", solicitud.id);
  } catch (e) {
    // No bloqueamos al paciente si falla el aviso a las clínicas — la
    // solicitud ya está guardada. Guardamos el motivo para poder
    // diagnosticarlo sin bucear en logs.
    await supabaseAdmin
      .from("solicitudes_presupuesto")
      .update({
        clinicas_notificadas: 0,
        notificacion_error: e instanceof Error ? e.message : String(e),
      })
      .eq("id", solicitud.id);
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
