"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notificarClinicasDeSolicitud } from "@/lib/leads/notificar-clinicas";
import { registrarEventoLead } from "@/lib/leads/lead-events";
import { transicionValida, type EstadoLead } from "@/lib/leads/estados-lead";
import { leerOpcionesCita } from "@/lib/leads/opciones-cita";
import { notificarClinicaCita } from "@/lib/leads/notificar-cita";

export type DatosSolicitud = {
  estudioId: string | null;
  sexo: string;
  tipoPerdidaCabello: string;
  ciudad: string;
  progresionPerdida: string;
  antecedentesFamiliares: string;
  medicacionActual: string;
  sintomasCueroCabelludo: string[];
  tratamientosUsados: string[];
  tratamientosUsadosDetalle: string;
  cambiosSaludRecientes: string;
  tratamientosInteres: string[];
  dejarDecidirMedico: boolean;
  codigoPostal: string;
  cuandoTratamiento: string;
  dondeTratamiento: string;
  presupuestoRango: string;
  prioridadDecision: string;
  alergias: string;
  condicionesMedicas: string[];
  cirugiasPrevias: string;
  fumador: string;
  aceptaMarketingEmail: boolean;
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
  // entre solicitudes), igual que nombre/apellidos/edad. El
  // consentimiento de marketing se guarda siempre tal cual está en el
  // formulario (también cuando se desmarca).
  await supabase
    .from("profiles")
    .update({
      ...(datos.sexo ? { sexo: datos.sexo } : {}),
      ...(datos.tipoPerdidaCabello
        ? { tipo_perdida_cabello: datos.tipoPerdidaCabello }
        : {}),
      acepta_marketing_email: datos.aceptaMarketingEmail,
    })
    .eq("id", user.id);

  const { data: solicitud, error } = await supabase
    .from("solicitudes_presupuesto")
    .insert({
      user_id: user.id,
      estudio_id: datos.estudioId,
      ciudad: datos.ciudad || null,
      progresion_perdida: datos.progresionPerdida || null,
      antecedentes_familiares: datos.antecedentesFamiliares || null,
      medicacion_actual: datos.medicacionActual || null,
      sintomas_cuero_cabelludo: datos.sintomasCueroCabelludo,
      tratamientos_usados: datos.tratamientosUsados,
      tratamientos_usados_detalle: datos.tratamientosUsadosDetalle || null,
      cambios_salud_recientes: datos.cambiosSaludRecientes || null,
      tratamientos_interes: datos.tratamientosInteres,
      dejar_decidir_medico: datos.dejarDecidirMedico,
      codigo_postal: datos.codigoPostal || null,
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
  await registrarEventoLead(supabaseAdmin, {
    event: "lead_created",
    solicitudId: solicitud.id,
  });

  try {
    const { candidatas, notificadas, ultimoError, matchScorePaciente } =
      await notificarClinicasDeSolicitud(supabaseAdmin, solicitud.id);
    await supabaseAdmin
      .from("solicitudes_presupuesto")
      .update({
        clinicas_notificadas: notificadas,
        match_score_paciente: matchScorePaciente,
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

/**
 * Fase 5: el paciente elige una de las propuestas recibidas. Solo esa
 * clínica se queda con el lead — el resto (con o sin propuesta
 * enviada) pasa a "no_seleccionado", y el nombre/teléfono/email del
 * paciente se libera únicamente a la clínica elegida (antes de esto,
 * solo veía el historial médico y las preferencias).
 */
export async function elegirClinica(solicitudId: string, leadId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/cuenta/login");
  }

  const { data: solicitud } = await supabase
    .from("solicitudes_presupuesto")
    .select("id")
    .eq("id", solicitudId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!solicitud) return;

  const admin = createAdminClient();

  const { data: leadElegido } = await admin
    .from("leads_clinica")
    .select("id, solicitud_id, clinic_id, estado")
    .eq("id", leadId)
    .eq("solicitud_id", solicitudId)
    .maybeSingle();

  if (!leadElegido) return;

  const estadoElegido = leadElegido.estado as EstadoLead;
  if (!transicionValida(estadoElegido, "seleccionado")) return;

  const ahora = new Date().toISOString();

  await admin
    .from("leads_clinica")
    .update({ estado: "seleccionado", seleccionado_en: ahora })
    .eq("id", leadElegido.id);

  await registrarEventoLead(admin, {
    event: "clinic_selected",
    solicitudId,
    leadId: leadElegido.id,
    clinicId: leadElegido.clinic_id,
  });
  await registrarEventoLead(admin, {
    event: "contact_released",
    solicitudId,
    leadId: leadElegido.id,
    clinicId: leadElegido.clinic_id,
  });

  const { data: otrosLeads } = await admin
    .from("leads_clinica")
    .select("id, estado, clinic_id")
    .eq("solicitud_id", solicitudId)
    .neq("id", leadElegido.id);

  for (const otro of otrosLeads ?? []) {
    const estadoOtro = otro.estado as EstadoLead;
    if (!transicionValida(estadoOtro, "no_seleccionado")) continue;

    await admin.from("leads_clinica").update({ estado: "no_seleccionado" }).eq("id", otro.id);
    await registrarEventoLead(admin, {
      event: "lead_lost",
      solicitudId,
      leadId: otro.id,
      clinicId: otro.clinic_id,
    });
  }

  revalidatePath(`/cuenta/solicitud/${solicitudId}`);
}

/**
 * Fase 6: el paciente valora cómo fue con la clínica que eligió, tras
 * la cita — 1 a 5 estrellas + comentario opcional. Se puede dar desde
 * "cita_realizada" en adelante (incluye convertido/no_convertido,
 * porque ese resultado lo cierra la clínica después de la cita) y
 * solo una vez.
 */
export async function enviarFeedback(
  solicitudId: string,
  leadId: string,
  formData: FormData,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/cuenta/login");
  }

  const { data: solicitud } = await supabase
    .from("solicitudes_presupuesto")
    .select("id")
    .eq("id", solicitudId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!solicitud) return;

  const puntuacion = Number(formData.get("puntuacion"));
  if (!Number.isInteger(puntuacion) || puntuacion < 1 || puntuacion > 5) return;
  const comentario = String(formData.get("comentario") ?? "").trim() || null;

  const admin = createAdminClient();
  const { data: lead } = await admin
    .from("leads_clinica")
    .select("id, solicitud_id, clinic_id, estado, feedback_recibido_en")
    .eq("id", leadId)
    .eq("solicitud_id", solicitudId)
    .maybeSingle();

  if (!lead || lead.feedback_recibido_en) return;

  const estadosConCita: EstadoLead[] = ["cita_realizada", "convertido", "no_convertido"];
  if (!estadosConCita.includes(lead.estado as EstadoLead)) return;

  await admin
    .from("leads_clinica")
    .update({
      feedback_puntuacion: puntuacion,
      feedback_comentario: comentario,
      feedback_recibido_en: new Date().toISOString(),
    })
    .eq("id", lead.id);

  await registrarEventoLead(admin, {
    event: "feedback_received",
    solicitudId,
    leadId: lead.id,
    clinicId: lead.clinic_id,
  });

  revalidatePath(`/cuenta/solicitud/${solicitudId}`);
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

/**
 * Comprueba que la solicitud es del paciente logueado y devuelve el
 * lead pedido (con el cliente admin, porque leads_clinica no tiene
 * acceso por RLS). null si algo no cuadra.
 */
async function leadDelPaciente(solicitudId: string, leadId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/cuenta/login");

  const { data: solicitud } = await supabase
    .from("solicitudes_presupuesto")
    .select("id")
    .eq("id", solicitudId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!solicitud) return null;

  const admin = createAdminClient();
  const { data: lead } = await admin
    .from("leads_clinica")
    .select("id, solicitud_id, clinic_id, estado, propuesta_vista_en, opciones_cita")
    .eq("id", leadId)
    .eq("solicitud_id", solicitudId)
    .maybeSingle();
  if (!lead) return null;

  return { admin, lead };
}

/** El paciente abre una propuesta: deja de ser "Propuesta nueva". */
export async function marcarPropuestaVista(solicitudId: string, leadId: string) {
  const r = await leadDelPaciente(solicitudId, leadId);
  if (!r || r.lead.propuesta_vista_en || r.lead.estado !== "propuesta_enviada") return;

  await r.admin
    .from("leads_clinica")
    .update({ propuesta_vista_en: new Date().toISOString() })
    .eq("id", r.lead.id);
  await registrarEventoLead(r.admin, {
    event: "proposal_viewed",
    solicitudId,
    leadId: r.lead.id,
    clinicId: r.lead.clinic_id,
  });
  revalidatePath(`/cuenta/solicitud/${solicitudId}`);
  revalidatePath("/cuenta");
}

/** "No, gracias": descarta esa propuesta sin liberar ningún dato. */
export async function descartarPropuesta(solicitudId: string, leadId: string) {
  const r = await leadDelPaciente(solicitudId, leadId);
  if (!r || r.lead.estado !== "propuesta_enviada") return;
  if (!transicionValida("propuesta_enviada", "no_seleccionado")) return;

  const ahora = new Date().toISOString();
  await r.admin
    .from("leads_clinica")
    .update({
      estado: "no_seleccionado",
      descartado_por_paciente_en: ahora,
      propuesta_vista_en: r.lead.propuesta_vista_en ?? ahora,
    })
    .eq("id", r.lead.id);
  await registrarEventoLead(r.admin, {
    event: "lead_lost",
    solicitudId,
    leadId: r.lead.id,
    clinicId: r.lead.clinic_id,
    metadata: { motivo: "descartada_por_paciente" },
  });
  revalidatePath(`/cuenta/solicitud/${solicitudId}`);
  revalidatePath("/cuenta");
}

/** El paciente confirma una de las fechas que propuso la clínica. */
export async function confirmarCita(solicitudId: string, leadId: string, formData: FormData) {
  const r = await leadDelPaciente(solicitudId, leadId);
  if (!r || r.lead.estado !== "cita_pendiente") return;
  if (!transicionValida("cita_pendiente", "cita_programada")) return;

  const opciones = leerOpcionesCita(r.lead.opciones_cita);
  const fecha = String(formData.get("fecha") ?? "");
  const opcion = opciones.find((o) => o.fecha === fecha);
  if (!opcion) return;

  await r.admin
    .from("leads_clinica")
    .update({
      estado: "cita_programada",
      cita_programada_en: new Date().toISOString(),
      fecha_cita: opcion.fecha,
    })
    .eq("id", r.lead.id);
  await registrarEventoLead(r.admin, {
    event: "appointment_created",
    solicitudId,
    leadId: r.lead.id,
    clinicId: r.lead.clinic_id,
    metadata: { modalidad: opcion.modalidad },
  });
  await notificarClinicaCita(r.admin, {
    leadId: r.lead.id,
    clinicId: r.lead.clinic_id,
    tipo: "confirmada",
    opcion,
  });
  revalidatePath(`/cuenta/solicitud/${solicitudId}`);
}

/** Ninguna fecha le va bien: la clínica tendrá que proponer otras. */
export async function pedirOtrasFechas(solicitudId: string, leadId: string) {
  const r = await leadDelPaciente(solicitudId, leadId);
  if (!r || r.lead.estado !== "cita_pendiente") return;

  await r.admin
    .from("leads_clinica")
    .update({ otras_fechas_pedidas_en: new Date().toISOString() })
    .eq("id", r.lead.id);
  await notificarClinicaCita(r.admin, {
    leadId: r.lead.id,
    clinicId: r.lead.clinic_id,
    tipo: "otras_fechas",
  });
  revalidatePath(`/cuenta/solicitud/${solicitudId}`);
}
