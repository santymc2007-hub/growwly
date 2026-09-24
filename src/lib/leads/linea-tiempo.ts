import type { Database } from "@/lib/supabase/database.types";
import { ESTADOS_LEAD, type EstadoLead } from "@/lib/leads/estados-lead";

type LeadRow = Database["public"]["Tables"]["leads_clinica"]["Row"];

export type PasoTimeline = {
  estado: EstadoLead;
  label: string;
  fecha: string | null;
  status: "completado" | "actual" | "pendiente";
};

/** Los pasos que sí se enseñan en la línea de tiempo — el "camino
 * feliz" del pipeline. Los estados negativos (no_seleccionado,
 * no_convertido, cancelado) no tienen su propio paso: se enseñan
 * aparte, como un aviso de por qué se cortó el proceso. */
const PASOS_CAMINO_FELIZ: { estado: EstadoLead; label: string }[] = [
  { estado: "enviado", label: "Enviado a la clínica" },
  { estado: "visto", label: "Visto por la clínica" },
  { estado: "desbloqueado", label: "Perfil desbloqueado" },
  { estado: "propuesta_enviada", label: "Propuesta enviada" },
  { estado: "seleccionado", label: "Elegido por el paciente" },
  { estado: "cita_pendiente", label: "Cita pendiente de fecha" },
  { estado: "cita_programada", label: "Cita programada" },
  { estado: "cita_realizada", label: "Cita realizada" },
  { estado: "convertido", label: "Tratamiento realizado" },
];

const ORDEN_CAMINO_FELIZ = PASOS_CAMINO_FELIZ.map((p) => p.estado);

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
 * fechas que ya se guardan directamente en `leads_clinica`
 * (enviado_en, visto_en, desbloqueado_en, propuesta_enviada_en) — los
 * pasos futuros (Fase 5-6, todavía sin columna de fecha propia) se
 * marcan completados por posición en cuanto el estado actual los ha
 * superado, aunque no tengan fecha exacta guardada todavía.
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
  };

  const idxActual = ORDEN_CAMINO_FELIZ.indexOf(estadoActual);

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
