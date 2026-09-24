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
 * La interfaz visual de hoy (panel de la clínica, `/leads/[token]`)
 * solo conoce enviado/visto/desbloqueado — el resto del pipeline
 * existe en la base de datos desde ya, pero nada lo dispara todavía.
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
 * pipeline normal, o cancelando desde cualquier punto no finalizado.
 * Pensada para que las Server Actions de fases futuras validen antes
 * de escribir en `leads_clinica.estado`, en vez de fiarse a ciegas de
 * lo que les llega.
 */
export function transicionValida(desde: EstadoLead, hasta: EstadoLead): boolean {
  if (desde === hasta) return false;
  if (hasta === "cancelado") return !esEstadoFinal(desde);
  return TRANSICIONES[desde].includes(hasta);
}
