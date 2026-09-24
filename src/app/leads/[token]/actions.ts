"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { registrarEventoLead } from "@/lib/leads/lead-events";
import { notificarPacientePropuesta } from "@/lib/leads/notificar-paciente";
import { transicionValida, type EstadoLead } from "@/lib/leads/estados-lead";

/**
 * Desbloquea un lead para que la clínica vea el perfil completo del
 * paciente. De momento es un desbloqueo directo (sin pasarela de pago
 * integrada) — Santy factura estos desbloqueos a mano por ahora. El
 * mismo campo "estado" que usaría un pago real ya queda preparado para
 * cuando se conecte Stripe más adelante: solo cambiará qué dispara
 * este mismo cambio de estado, no la estructura de datos.
 */
export async function desbloquearLead(token: string) {
  const supabase = createAdminClient();

  const { data: lead } = await supabase
    .from("leads_clinica")
    .update({ estado: "desbloqueado", desbloqueado_en: new Date().toISOString() })
    .eq("token", token)
    .select("id, solicitud_id, clinic_id")
    .maybeSingle();

  if (lead) {
    await registrarEventoLead(supabase, {
      event: "lead_unlocked",
      solicitudId: lead.solicitud_id,
      leadId: lead.id,
      clinicId: lead.clinic_id,
    });
  }

  revalidatePath(`/leads/${token}`);
}

/**
 * Guarda (o actualiza) la propuesta estructurada de la clínica para
 * este lead — el "Responder con propuesta" de la Fase 4. Solo se
 * puede enviar/editar mientras el lead esté en "desbloqueado" (primer
 * envío) o "propuesta_enviada" (edición); una vez el paciente avanza
 * más allá, ya no se admite tocarla — se protege aquí por si alguien
 * reabre un enlace de email viejo.
 */
export async function guardarPropuesta(token: string, formData: FormData) {
  try {
    const supabase = createAdminClient();

    const { data: lead } = await supabase
      .from("leads_clinica")
      .select("id, solicitud_id, clinic_id, estado")
      .eq("token", token)
      .maybeSingle();

    if (!lead) return;

    const estadoActual = lead.estado as EstadoLead;
    const esPrimeraVez = estadoActual === "desbloqueado";
    if (!esPrimeraVez && estadoActual !== "propuesta_enviada") {
      return;
    }

    const tipoPrecio = String(formData.get("tipo_precio") ?? "");
    if (!["cerrado", "desde", "rango", "valoracion"].includes(tipoPrecio)) {
      return;
    }

    const num = (key: string) => {
      const v = formData.get(key);
      return v && String(v).trim() !== "" ? Number(v) : null;
    };

    let precioMin = num("precio_min");
    let precioMax = num("precio_max");
    if (tipoPrecio === "cerrado") precioMax = precioMin;
    if (tipoPrecio === "valoracion") {
      precioMin = null;
      precioMax = null;
    }

    const tipoConsulta = String(formData.get("tipo_consulta") ?? "").trim() || null;
    const incluye = formData.getAll("incluye").map(String);
    const disponibilidad = String(formData.get("disponibilidad") ?? "").trim() || null;
    const tratamiento = String(formData.get("tratamiento") ?? "").trim() || null;
    const mensaje = String(formData.get("mensaje") ?? "").trim() || null;
    const validoHasta = String(formData.get("valido_hasta") ?? "").trim() || null;

    const { error } = await supabase.from("propuestas_clinica").upsert(
      {
        lead_id: lead.id,
        tratamiento,
        tipo_precio: tipoPrecio,
        precio_min: precioMin,
        precio_max: precioMax,
        tipo_consulta: tipoConsulta,
        disponibilidad,
        incluye,
        mensaje,
        valido_hasta: validoHasta,
        actualizado_en: new Date().toISOString(),
      },
      { onConflict: "lead_id" },
    );

    if (error) {
      console.error("No se pudo guardar la propuesta:", error.message);
      return;
    }

    if (esPrimeraVez && transicionValida(estadoActual, "propuesta_enviada")) {
      await supabase
        .from("leads_clinica")
        .update({ estado: "propuesta_enviada", propuesta_enviada_en: new Date().toISOString() })
        .eq("id", lead.id);

      await registrarEventoLead(supabase, {
        event: "proposal_created",
        solicitudId: lead.solicitud_id,
        leadId: lead.id,
        clinicId: lead.clinic_id,
      });
      await registrarEventoLead(supabase, {
        event: "proposal_sent",
        solicitudId: lead.solicitud_id,
        leadId: lead.id,
        clinicId: lead.clinic_id,
      });

      await notificarPacientePropuesta(supabase, {
        solicitudId: lead.solicitud_id,
        clinicId: lead.clinic_id,
      });
    }

    revalidatePath(`/leads/${token}`);
  } catch (e) {
    console.error("Error inesperado guardando propuesta:", e);
  }
}

/**
 * Fase 6: la clínica fija la fecha de la cita tras haber sido elegida
 * — sin calendario externo conectado, se guarda tal cual la introduce
 * la clínica. Avanza "seleccionado" -> "cita_pendiente" ->
 * "cita_programada" en un solo paso (no hay ninguna acción de UI
 * propia para el estado intermedio) y registra un único evento
 * "appointment_created". Si ya estaba programada, permite reprogramar
 * la fecha sin volver a disparar el evento ni tocar el estado.
 */
export async function programarCita(token: string, formData: FormData) {
  try {
    const supabase = createAdminClient();

    const { data: lead } = await supabase
      .from("leads_clinica")
      .select("id, solicitud_id, clinic_id, estado")
      .eq("token", token)
      .maybeSingle();

    if (!lead) return;

    const fechaCitaRaw = String(formData.get("fecha_cita") ?? "").trim();
    if (!fechaCitaRaw) return;
    const fechaCita = new Date(fechaCitaRaw);
    if (Number.isNaN(fechaCita.getTime())) return;

    const estadoActual = lead.estado as EstadoLead;
    const ahora = new Date().toISOString();

    if (estadoActual === "cita_programada") {
      // Reprogramar: mismo estado, solo cambia la fecha.
      await supabase
        .from("leads_clinica")
        .update({ fecha_cita: fechaCita.toISOString() })
        .eq("id", lead.id);
      revalidatePath(`/leads/${token}`);
      return;
    }

    if (
      estadoActual !== "seleccionado" ||
      !transicionValida(estadoActual, "cita_pendiente") ||
      !transicionValida("cita_pendiente", "cita_programada")
    ) {
      return;
    }

    await supabase
      .from("leads_clinica")
      .update({
        estado: "cita_programada",
        cita_pendiente_en: ahora,
        cita_programada_en: ahora,
        fecha_cita: fechaCita.toISOString(),
      })
      .eq("id", lead.id);

    await registrarEventoLead(supabase, {
      event: "appointment_created",
      solicitudId: lead.solicitud_id,
      leadId: lead.id,
      clinicId: lead.clinic_id,
    });

    revalidatePath(`/leads/${token}`);
  } catch (e) {
    console.error("Error inesperado programando la cita:", e);
  }
}

/** Fase 6: la clínica confirma que la cita ya tuvo lugar. */
export async function marcarCitaRealizada(token: string) {
  try {
    const supabase = createAdminClient();

    const { data: lead } = await supabase
      .from("leads_clinica")
      .select("id, solicitud_id, clinic_id, estado")
      .eq("token", token)
      .maybeSingle();

    if (!lead) return;

    const estadoActual = lead.estado as EstadoLead;
    if (!transicionValida(estadoActual, "cita_realizada")) return;

    await supabase
      .from("leads_clinica")
      .update({ estado: "cita_realizada", cita_realizada_en: new Date().toISOString() })
      .eq("id", lead.id);

    await registrarEventoLead(supabase, {
      event: "appointment_completed",
      solicitudId: lead.solicitud_id,
      leadId: lead.id,
      clinicId: lead.clinic_id,
    });

    revalidatePath(`/leads/${token}`);
  } catch (e) {
    console.error("Error inesperado marcando la cita como realizada:", e);
  }
}

/**
 * Fase 6: la clínica cierra el lead tras la cita — ¿siguió el
 * paciente adelante con el tratamiento o no? Resultado final del
 * pipeline para esta clínica.
 */
export async function marcarResultadoTratamiento(
  token: string,
  resultado: "convertido" | "no_convertido",
) {
  try {
    const supabase = createAdminClient();

    const { data: lead } = await supabase
      .from("leads_clinica")
      .select("id, solicitud_id, clinic_id, estado")
      .eq("token", token)
      .maybeSingle();

    if (!lead) return;

    const estadoActual = lead.estado as EstadoLead;
    if (!transicionValida(estadoActual, resultado)) return;

    const ahora = new Date().toISOString();
    await supabase
      .from("leads_clinica")
      .update({
        estado: resultado,
        ...(resultado === "convertido"
          ? { convertido_en: ahora }
          : { no_convertido_en: ahora }),
      })
      .eq("id", lead.id);

    await registrarEventoLead(supabase, {
      event: resultado === "convertido" ? "lead_converted" : "lead_lost",
      solicitudId: lead.solicitud_id,
      leadId: lead.id,
      clinicId: lead.clinic_id,
    });

    revalidatePath(`/leads/${token}`);
  } catch (e) {
    console.error("Error inesperado guardando el resultado del tratamiento:", e);
  }
}
