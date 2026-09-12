"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notificarClinicasDeSolicitud } from "@/lib/leads/notificar-clinicas";

export type DatosSolicitud = {
  estudioId: string | null;
  sexo: string;
  tipoPerdidaCabello: string;
  ciudad: string;
  progresionPerdida: string;
  antecedentesFamiliares: string;
  medicacionActual: string;
  tratamientosInteres: string[];
  dejarDecidirMedico: boolean;
  cuandoTratamiento: string;
  dondeTratamiento: string;
  presupuestoRango: string;
  prioridadDecision: string;
  alergias: string;
  condicionesMedicas: string[];
  cirugiasPrevias: string;
  fumador: string;
  consentimientoDatos: boolean;
  consentimientoInfoMedica: boolean;
  consentimientoFotos: boolean;
  consentimientoCompartir: boolean;
  consentimientoTerminos: boolean;
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

  if (
    !datos.consentimientoDatos ||
    !datos.consentimientoInfoMedica ||
    !datos.consentimientoFotos ||
    !datos.consentimientoCompartir ||
    !datos.consentimientoTerminos
  ) {
    return { error: "Hacen falta los 5 consentimientos para continuar." };
  }

  const ahora = new Date().toISOString();

  // Sexo y tipo de pérdida de cabello son datos del perfil (no cambian
  // entre solicitudes), igual que nombre/apellidos/edad.
  if (datos.sexo || datos.tipoPerdidaCabello) {
    await supabase
      .from("profiles")
      .update({
        ...(datos.sexo ? { sexo: datos.sexo } : {}),
        ...(datos.tipoPerdidaCabello
          ? { tipo_perdida_cabello: datos.tipoPerdidaCabello }
          : {}),
      })
      .eq("id", user.id);
  }

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
      prioridad_decision: datos.prioridadDecision || null,
      alergias: datos.alergias || null,
      condiciones_medicas: datos.condicionesMedicas,
      cirugias_previas: datos.cirugiasPrevias || null,
      fumador: datos.fumador || null,
      consentimiento_datos_en: ahora,
      consentimiento_info_medica_en: ahora,
      consentimiento_fotos_en: ahora,
      consentimiento_compartir_en: ahora,
      consentimiento_terminos_en: ahora,
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
