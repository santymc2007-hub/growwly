import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";

/**
 * Fase 1 del sistema de seguimiento de leads: registrar cada paso del
 * ciclo de vida en `lead_events`. Es la base sobre la que se calculará
 * el Growwly Score más adelante (tiempo de respuesta, % de leads
 * gestionados) — con datos reales acumulados, no con pesos inventados
 * desde el día uno. Se irán añadiendo más tipos de evento en fases
 * posteriores (proposal_sent, clinic_selected, appointment_*...).
 */
export type EventoLead = "lead_created" | "lead_assigned" | "lead_opened" | "lead_unlocked";

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
