import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type MetricasLeadsClinica = {
  /** Minutos de media entre "se le asignó el lead" y "lo desbloqueó". */
  tiempoRespuestaPromedioMinutos: number | null;
  /** % de leads asignados que la clínica llegó a desbloquear (0-1). */
  tasaGestionLeads: number | null;
};

/**
 * Calcula las métricas de comportamiento de una clínica a partir de
 * `lead_events` — la base real sobre la que se apoya el Growwly Score.
 *
 * Son una aproximación mientras no exista la Propuesta (Fase 4): el
 * documento original mide "tiempo hasta responder con una propuesta" y
 * "% de desbloqueados que llegan a propuesta", pero ese evento
 * (`proposal_sent`) todavía no existe. De momento se usa el mejor
 * proxy disponible — "asignado → desbloqueado" — y se sustituirá por
 * la métrica exacta en cuanto exista, sin tocar los pesos del score.
 */
export async function calcularMetricasLeadsClinica(
  supabaseAdmin: SupabaseClient<Database>,
  clinicId: string,
): Promise<MetricasLeadsClinica> {
  const { data: eventos } = await supabaseAdmin
    .from("lead_events")
    .select("event, lead_id, created_at")
    .eq("clinic_id", clinicId)
    .in("event", ["lead_assigned", "lead_unlocked"]);

  const porLead = new Map<string, { asignado?: string; desbloqueado?: string }>();
  for (const e of eventos ?? []) {
    if (!e.lead_id) continue;
    const entrada = porLead.get(e.lead_id) ?? {};
    if (e.event === "lead_assigned") entrada.asignado = e.created_at;
    if (e.event === "lead_unlocked") entrada.desbloqueado = e.created_at;
    porLead.set(e.lead_id, entrada);
  }

  let asignados = 0;
  let desbloqueados = 0;
  const minutosRespuesta: number[] = [];

  for (const { asignado, desbloqueado } of porLead.values()) {
    if (asignado) asignados++;
    if (desbloqueado) desbloqueados++;
    if (asignado && desbloqueado) {
      const minutos =
        (new Date(desbloqueado).getTime() - new Date(asignado).getTime()) / 60000;
      if (minutos >= 0) minutosRespuesta.push(minutos);
    }
  }

  return {
    tiempoRespuestaPromedioMinutos:
      minutosRespuesta.length > 0
        ? minutosRespuesta.reduce((a, b) => a + b, 0) / minutosRespuesta.length
        : null,
    tasaGestionLeads: asignados > 0 ? desbloqueados / asignados : null,
  };
}
