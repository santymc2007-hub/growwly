import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type MetricasLeadsClinica = {
  /** Minutos de media entre "se le asignó el lead" y "le envió propuesta". */
  tiempoRespuestaPromedioMinutos: number | null;
  /** % de leads asignados a los que la clínica llegó a enviar propuesta (0-1). */
  tasaGestionLeads: number | null;
};

/**
 * Calcula las métricas de comportamiento de una clínica a partir de
 * `lead_events` — la base real sobre la que se apoya el Growwly Score.
 *
 * Mide "tiempo hasta responder con una propuesta" y "% de asignados que
 * llegan a propuesta" usando el evento `proposal_sent` (Fase 4). Antes
 * de que existiera esta métrica se usaba como proxy "asignado →
 * desbloqueado", pero ese paso de desbloqueo manual ya no existe: las
 * clínicas ven el perfil completo (salvo contacto) desde el momento en
 * que reciben el lead, así que enviar propuesta es ahora la única
 * acción real que mide compromiso.
 */
export async function calcularMetricasLeadsClinica(
  supabaseAdmin: SupabaseClient<Database>,
  clinicId: string,
): Promise<MetricasLeadsClinica> {
  const { data: eventos } = await supabaseAdmin
    .from("lead_events")
    .select("event, lead_id, created_at")
    .eq("clinic_id", clinicId)
    .in("event", ["lead_assigned", "proposal_sent"]);

  const porLead = new Map<string, { asignado?: string; propuestaEnviada?: string }>();
  for (const e of eventos ?? []) {
    if (!e.lead_id) continue;
    const entrada = porLead.get(e.lead_id) ?? {};
    if (e.event === "lead_assigned") entrada.asignado = e.created_at;
    if (e.event === "proposal_sent") entrada.propuestaEnviada = e.created_at;
    porLead.set(e.lead_id, entrada);
  }

  let asignados = 0;
  let conPropuesta = 0;
  const minutosRespuesta: number[] = [];

  for (const { asignado, propuestaEnviada } of porLead.values()) {
    if (asignado) asignados++;
    if (propuestaEnviada) conPropuesta++;
    if (asignado && propuestaEnviada) {
      const minutos =
        (new Date(propuestaEnviada).getTime() - new Date(asignado).getTime()) / 60000;
      if (minutos >= 0) minutosRespuesta.push(minutos);
    }
  }

  return {
    tiempoRespuestaPromedioMinutos:
      minutosRespuesta.length > 0
        ? minutosRespuesta.reduce((a, b) => a + b, 0) / minutosRespuesta.length
        : null,
    tasaGestionLeads: asignados > 0 ? conPropuesta / asignados : null,
  };
}
