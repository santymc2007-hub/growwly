/**
 * Fase 3 del sistema de seguimiento de leads: el pipeline completo de
 * un lead PARA UNA CLÍNICA CONCRETA (cada clínica de una solicitud
 * repartida tiene su propio estado — no es un estado global de la
 * solicitud). Fuente única de verdad para todas las fases que vienen
 * después (Fase 4 activa "propuesta_enviada", Fase 5 "seleccionado" /
 * "no_seleccionado", Fase 6 el resto) — nadie debería escribir un
 * string suelto en `leads_clinica.estado`, siempre a través de este
 * módulo.
 *
 * Fase 4 activó "propuesta_enviada" y Fase 5 "seleccionado" /
 * "no_seleccionado" (con liberación de contacto al paciente incluida)
 * — "cita_pendiente" en adelante sigue sin disparador todavía.
 */
export const ESTADOS_LEAD = [
  "enviado",
  "visto",
  "desbloqueado",
  "propuesta_enviada",
  "seleccionado",
  "no_seleccionado",
  "cita_pendiente",
  "cita_programada",
  "cita_realizada",
  "convertido",
  "no_convertido",
  "cancelado",
] as const;

export type EstadoLead = (typeof ESTADOS_LEAD)[number];

/** Estados que ya no cambian más — el pipeline para esa clínica ha terminado. */
export const ESTADOS_FINALES: EstadoLead[] = [
  "no_seleccionado",
  "convertido",
  "no_convertido",
  "cancelado",
];

/**
 * Grafo de transiciones válidas. "cancelado" se puede alcanzar desde
 * cualquier estado todavía no finalizado (una clínica puede cancelar
 * en cualquier momento del proceso), así que se añade aparte en vez
 * de repetirlo en cada fila.
 */
const TRANSICIONES: Record<EstadoLead, EstadoLead[]> = {
  enviado: ["visto"],
  visto: ["desbloqueado"],
  desbloqueado: ["propuesta_enviada"],
  propuesta_enviada: ["seleccionado", "no_seleccionado"],
  seleccionado: ["cita_pendiente"],
  no_seleccionado: [],
  cita_pendiente: ["cita_programada"],
  cita_programada: ["cita_realizada"],
  cita_realizada: ["convertido", "no_convertido"],
  convertido: [],
  no_convertido: [],
  cancelado: [],
};

export function esEstadoFinal(estado: EstadoLead): boolean {
  return ESTADOS_FINALES.includes(estado);
}

/**
 * Comprueba si se puede pasar de un estado a otro siguiendo el
 * pipeline normal, cancelando desde cualquier punto no finalizado, o
 * quedando fuera (no_seleccionado) porque el paciente ha elegido otra
 * clínica — puede pasarle a una clínica que todavía no había enviado
 * propuesta, así que "no_seleccionado" se trata igual que "cancelado":
 * alcanzable desde cualquier estado no finalizado, no solo desde
 * "propuesta_enviada". Pensada para que las Server Actions de fases
 * futuras validen antes de escribir en `leads_clinica.estado`, en vez
 * de fiarse a ciegas de lo que les llega.
 */
export function transicionValida(desde: EstadoLead, hasta: EstadoLead): boolean {
  if (desde === hasta) return false;
  if (hasta === "cancelado" || hasta === "no_seleccionado") return !esEstadoFinal(desde);
  return TRANSICIONES[desde].includes(hasta);
}

/**
 * El orden del "camino feliz" del pipeline (sin los estados negativos
 * que se salen de la línea recta) — fuente única para la línea de
 * tiempo visual y para saber, por posición, si un estado ya pasó por
 * "seleccionado" o más allá.
 */
export const ORDEN_PIPELINE: EstadoLead[] = [
  "enviado",
  "visto",
  "desbloqueado",
  "propuesta_enviada",
  "seleccionado",
  "cita_pendiente",
  "cita_programada",
  "cita_realizada",
  "convertido",
];

/**
 * El paciente elige una clínica sin ver su contacto de antemano — el
 * nombre/teléfono/email solo se libera a la clínica elegida, a partir
 * de que se la selecciona (Fase 5). "no_convertido" se incluye aparte
 * porque implica que hubo cita, es decir que el contacto ya se liberó
 * antes de llegar a ese estado final.
 */
export function contactoLiberado(estado: EstadoLead): boolean {
  if (estado === "no_convertido") return true;
  const idx = ORDEN_PIPELINE.indexOf(estado);
  return idx !== -1 && idx >= ORDEN_PIPELINE.indexOf("seleccionado");
}
