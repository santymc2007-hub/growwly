/**
 * Pasos del embudo propio (tabla embudo_eventos). Compartido entre el
 * navegador, la API y el panel de admin.
 *
 * Valoración capilar → lead:
 *   val_formulario → val_camara / val_fotos → val_enviada → val_lista
 *   (o val_error / val_rechazada) → val_resultado_visto → val_email → val_cuenta
 * Solicitud de presupuesto (asistente):
 *   sol_inicio → sol_paso (detalle = paso) → sol_enviada (o sol_error)
 * Pedir cita desde la ficha de un centro (contacto directo, otro valor):
 *   cita_formulario → cita_enviada (o cita_error)
 * Llegadas y banner de cookies (para cruzar con los clics de los anuncios):
 *   llegada_anuncio (la web ha cargado con parámetros de campaña en la URL)
 *   → cookies_decision (detalle = lo que eligió en el banner)
 */
export const PASOS_EMBUDO = [
  "llegada_anuncio",
  "cookies_decision",
  "val_formulario",
  "val_camara",
  "val_fotos",
  "val_enviada",
  "val_rechazada",
  "val_lista",
  "val_error",
  "val_resultado_visto",
  "val_email",
  "val_cuenta",
  "sol_inicio",
  "sol_paso",
  "sol_enviada",
  "sol_error",
  "cita_formulario",
  "cita_enviada",
  "cita_error",
] as const;

export type PasoEmbudo = (typeof PASOS_EMBUDO)[number];

export function esPasoEmbudo(valor: unknown): valor is PasoEmbudo {
  return typeof valor === "string" && (PASOS_EMBUDO as readonly string[]).includes(valor);
}

/** Nombres para el panel, en el orden del embudo. */
export const ETIQUETA_PASO: Record<PasoEmbudo, string> = {
  llegada_anuncio: "Llega desde un anuncio o enlace con campaña",
  cookies_decision: "Decide en el banner de cookies",
  val_formulario: "Entra en la valoración",
  val_camara: "Abre la cámara guiada",
  val_fotos: "Añade fotos",
  val_enviada: "Envía las fotos",
  val_rechazada: "Envío rechazado (fotos, casillas, límite…)",
  val_lista: "Valoración generada",
  val_error: "Valoración con error",
  val_resultado_visto: "Ve la pantalla de su valoración",
  val_email: "Deja su email",
  val_cuenta: "Crea su cuenta",
  sol_inicio: "Abre el asistente de presupuesto",
  sol_paso: "Completa un paso del asistente",
  sol_enviada: "Envía la solicitud de presupuesto",
  sol_error: "Error al enviar la solicitud",
  cita_formulario: "Abre «Pedir cita» en una ficha",
  cita_enviada: "Envía «Pedir cita»",
  cita_error: "Error al enviar «Pedir cita»",
};

/**
 * Pasos que se guardan con el origen leído de la URL de esa misma
 * página (no del navegador): así se sabe de qué anuncio vienen aunque
 * no se acepten las cookies, sin guardar nada en el dispositivo.
 */
export const PASOS_CON_ORIGEN_URL: readonly PasoEmbudo[] = ["llegada_anuncio", "cookies_decision"];
