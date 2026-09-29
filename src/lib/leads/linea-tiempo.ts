import type { Database } from "@/lib/supabase/database.types";
import { ESTADOS_LEAD, ORDEN_PIPELINE, type EstadoLead } from "@/lib/leads/estados-lead";

type LeadRow = Database["public"]["Tables"]["leads_clinica"]["Row"];

export type PasoTimeline = {
  estado: EstadoLead;
  label: string;
  fecha: string | null;
  status: "completado" | "actual" | "pendiente";
};

/** Los hitos que se enseñan en la evolución del lead (en horizontal).
 * Los estados intermedios del pipeline (desbloqueado, cita_pendiente,
 * cita_realizada) no tienen hito propio: cuentan como camino hacia el
 * siguiente. El orden sigue ORDEN_PIPELINE de estados-lead.ts. Los
 * estados negativos (no_seleccionado, no_convertido, cancelado) se
 * enseñan aparte, como aviso de por qué se cortó el proceso. */
const HITOS: { estado: EstadoLead; label: string }[] = [
  { estado: "enviado", label: "Enviado a la clínica" },
  { estado: "visto", label: "Visto por la clínica" },
  { estado: "propuesta_enviada", label: "Propuesta enviada" },
  { estado: "seleccionado", label: "Elegido por el paciente" },
  { estado: "cita_programada", label: "Cita programada" },
  { estado: "convertido", label: "Tratamiento realizado" },
];

/** Por qué se cortó el proceso, para los estados que no siguen el
 * camino feliz — no tienen una posición fija en la línea de tiempo
 * (p. ej. "cancelado" puede llegar desde casi cualquier paso). */
const AVISO_ESTADO_NEGATIVO: Partial<Record<EstadoLead, string>> = {
  no_seleccionado: "El paciente eligió otra clínica.",
  no_convertido: "Hubo cita, pero el paciente no siguió adelante con el tratamiento.",
  cancelado: "El proceso se canceló.",
};

/**
 * Construye la línea de tiempo visual de un lead a partir de las
 * fechas que ya se guardan directamente en `leads_clinica` — todos
 * los pasos del camino feliz tienen ya su propia columna de fecha
 * desde la Fase 6. Solo "convertido" (último paso) se sigue marcando
 * completado sin fecha extra: coincide con el estado actual, así que
 * ya tiene su propio caso ("actual") en el switch de abajo.
 */
export function construirPasosTimeline(lead: LeadRow): {
  pasos: PasoTimeline[];
  avisoNegativo: string | null;
} {
  const estadoActual = lead.estado as EstadoLead;
  const fechaPorEstado: Partial<Record<EstadoLead, string | null>> = {
    enviado: lead.enviado_en,
    visto: lead.visto_en,
    desbloqueado: lead.desbloqueado_en,
    propuesta_enviada: lead.propuesta_enviada_en,
    seleccionado: lead.seleccionado_en,
    cita_pendiente: lead.cita_pendiente_en,
    cita_programada: lead.cita_programada_en,
    cita_realizada: lead.cita_realizada_en,
    convertido: lead.convertido_en,
  };

  const idxActual = ORDEN_PIPELINE.indexOf(estadoActual);

  const pasos: PasoTimeline[] = HITOS.map(({ estado, label }) => {
    const fecha = fechaPorEstado[estado] ?? null;
    const idxHito = ORDEN_PIPELINE.indexOf(estado);
    let status: PasoTimeline["status"];
    if (estado === estadoActual) {
      status = "actual";
    } else if (fecha || (idxActual !== -1 && idxHito < idxActual)) {
      status = "completado";
    } else {
      status = "pendiente";
    }
    return { estado, label, fecha, status };
  });

  // Si el estado actual no está en ESTADOS_LEAD (no debería pasar,
  // pero por si acaso) tratamos "no lo encontramos" con seguridad.
  if (!ESTADOS_LEAD.includes(estadoActual)) {
    return { pasos, avisoNegativo: null };
  }

  return { pasos, avisoNegativo: AVISO_ESTADO_NEGATIVO[estadoActual] ?? null };
}
