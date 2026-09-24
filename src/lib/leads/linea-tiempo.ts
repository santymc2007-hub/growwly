import type { Database } from "@/lib/supabase/database.types";
import { ESTADOS_LEAD, ORDEN_PIPELINE, type EstadoLead } from "@/lib/leads/estados-lead";

type LeadRow = Database["public"]["Tables"]["leads_clinica"]["Row"];

export type PasoTimeline = {
  estado: EstadoLead;
  label: string;
  fecha: string | null;
  status: "completado" | "actual" | "pendiente";
};

/** Las etiquetas de los pasos que sí se enseñan en la línea de tiempo
 * — el orden es el mismo ORDEN_PIPELINE de estados-lead.ts (fuente
 * única de verdad), para que no se puedan desincronizar. Los estados
 * negativos (no_seleccionado, no_convertido, cancelado) no tienen su
 * propio paso: se enseñan aparte, como un aviso de por qué se cortó
 * el proceso. */
const LABEL_PASO: Record<
  | "enviado"
  | "visto"
  | "desbloqueado"
  | "propuesta_enviada"
  | "seleccionado"
  | "cita_pendiente"
  | "cita_programada"
  | "cita_realizada"
  | "convertido",
  string
> = {
  enviado: "Enviado a la clínica",
  visto: "Visto por la clínica",
  desbloqueado: "Perfil desbloqueado",
  propuesta_enviada: "Propuesta enviada",
  seleccionado: "Elegido por el paciente",
  cita_pendiente: "Cita pendiente de fecha",
  cita_programada: "Cita programada",
  cita_realizada: "Cita realizada",
  convertido: "Tratamiento realizado",
};

const PASOS_CAMINO_FELIZ = ORDEN_PIPELINE.map((estado) => ({
  estado,
  label: LABEL_PASO[estado as keyof typeof LABEL_PASO],
}));

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

  const pasos: PasoTimeline[] = PASOS_CAMINO_FELIZ.map(({ estado, label }, idx) => {
    const fecha = fechaPorEstado[estado] ?? null;
    let status: PasoTimeline["status"];
    if (estado === estadoActual) {
      status = "actual";
    } else if (fecha || (idxActual !== -1 && idx < idxActual)) {
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
