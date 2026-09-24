"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { registrarEventoLead } from "@/lib/leads/lead-events";
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
    }

    revalidatePath(`/leads/${token}`);
  } catch (e) {
    console.error("Error inesperado guardando propuesta:", e);
  }
}
