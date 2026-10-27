import type { EstadoLead } from "@/lib/leads/estados-lead";

/**
 * Mismo color por estado que usan las tarjetas de /clinica/solicitudes
 * (ESTADO_INFO ahí) — aquí en hex plano para gráficas/barras, así la
 * clínica reconoce de un vistazo el estado en estadísticas sin tener
 * que releer la leyenda.
 */
export const ESTADO_COLOR: Record<EstadoLead, string> = {
  enviado: "#e8ef2d",
  visto: "#ffba1f",
  propuesta_enviada: "#00768f",
  seleccionado: "#1f6b43",
  cita_pendiente: "#00768f",
  cita_programada: "#00768f",
  cita_realizada: "#1f6b43",
  convertido: "#1f6b43",
  no_seleccionado: "#ffba1f",
  no_convertido: "#66756f",
  cancelado: "#66756f",
};
