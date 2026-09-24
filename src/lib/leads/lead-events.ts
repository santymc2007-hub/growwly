import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";

/**
 * Registro de cada paso del ciclo de vida en `lead_events`. Es la base
 * sobre la que se calcula el Growwly Score (tiempo de respuesta, % de
 * leads gestionados) — con datos reales acumulados, no con pesos
 * inventados desde el día uno.
 *
 * El vocabulario completo (Fase 3) ya está definido y reflejado en un
 * CHECK de la base de datos, aunque hoy solo se disparen los 4
 * primeros (Fase 1-2, ya en producción) — el resto se activa fase a
 * fase sin tener que tocar el esquema otra vez:
 * proposal_created/sent/viewed en la Fase 4, clinic_selected y
 * contact_released en la Fase 5, appointment_* y feedback_received en
 * la Fase 6, lead_converted/lead_lost como resultado final.
 */
export type EventoLead =
  | "lead_created"
  | "lead_assigned"
  | "lead_opened"
  | "lead_unlocked"
  | "proposal_created"
  | "proposal_sent"
  | "proposal_viewed"
  | "clinic_selected"
  | "contact_released"
  | "appointment_created"
  | "appointment_completed"
  | "feedback_received"
  | "lead_converted"
  | "lead_lost";

export async function registrarEventoLead(
  supabaseAdmin: SupabaseClient<Database>,
  params: {
    event: EventoLead;
    solicitudId?: string | null;
    leadId?: string | null;
    clinicId?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  const { error } = await supabaseAdmin.from("lead_events").insert({
    event: params.event,
    solicitud_id: params.solicitudId ?? null,
    lead_id: params.leadId ?? null,
    clinic_id: params.clinicId ?? null,
    metadata: (params.metadata ?? {}) as Json,
  });

  if (error) {
    // Un fallo aquí no debe tumbar el flujo principal (crear la
    // solicitud, ver el lead, desbloquearlo...) — en el peor caso se
    // pierde ese evento puntual para las métricas futuras, pero el
    // paciente o la clínica no lo notan.
    console.error("No se pudo registrar evento de lead:", params.event, error.message);
  }
}
