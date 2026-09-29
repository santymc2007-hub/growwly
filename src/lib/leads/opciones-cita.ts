import type { Json } from "@/lib/supabase/database.types";

export type ModalidadCita = "presencial" | "videollamada";

/** Una de las fechas que la clínica propone para la valoración. */
export type OpcionCita = { fecha: string; modalidad: ModalidadCita };

export const MAX_OPCIONES_CITA = 3;

/** Lee `leads_clinica.opciones_cita` (jsonb) descartando lo que no encaje. */
export function leerOpcionesCita(valor: Json | null | undefined): OpcionCita[] {
  if (!Array.isArray(valor)) return [];
  const opciones: OpcionCita[] = [];
  for (const item of valor) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const fecha = typeof item.fecha === "string" ? item.fecha : null;
    if (!fecha || Number.isNaN(new Date(fecha).getTime())) continue;
    opciones.push({
      fecha,
      modalidad: item.modalidad === "videollamada" ? "videollamada" : "presencial",
    });
  }
  return opciones.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

const ZONA = "Europe/Madrid";

export function partesFecha(fecha: string) {
  const d = new Date(fecha);
  const dia = d
    .toLocaleDateString("es-ES", { weekday: "short", timeZone: ZONA })
    .replace(".", "");
  return {
    dia: dia.charAt(0).toUpperCase() + dia.slice(1),
    num: d.toLocaleDateString("es-ES", { day: "numeric", timeZone: ZONA }),
    mes: d.toLocaleDateString("es-ES", { month: "short", timeZone: ZONA }).replace(".", ""),
    hora: d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: ZONA }),
  };
}

/** "Jueves 2 oct · 17:30" */
export function fechaCitaLarga(fecha: string): string {
  const d = new Date(fecha);
  const dia = d.toLocaleDateString("es-ES", { weekday: "long", timeZone: ZONA });
  const p = partesFecha(fecha);
  return `${dia.charAt(0).toUpperCase() + dia.slice(1)} ${p.num} ${p.mes} · ${p.hora}`;
}

/**
 * Convierte el valor de un <input type="datetime-local"> (hora de
 * Madrid, sin zona) a ISO en UTC. Vercel corre en UTC, así que no se
 * puede fiar de `new Date(valor)`.
 */
export function datetimeLocalMadridAIso(valor: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(valor.trim());
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number);
  const comoUtc = Date.UTC(y, mo - 1, d, h, mi);
  // Desfase de Madrid en ese instante (1 h en invierno, 2 h en verano).
  const enMadrid = new Date(
    new Date(comoUtc).toLocaleString("en-US", { timeZone: ZONA }),
  ).getTime();
  const enUtc = new Date(
    new Date(comoUtc).toLocaleString("en-US", { timeZone: "UTC" }),
  ).getTime();
  return new Date(comoUtc - (enMadrid - enUtc)).toISOString();
}

/** ISO -> valor para <input type="datetime-local"> en hora de Madrid. */
export function isoADatetimeLocalMadrid(iso: string): string {
  const d = new Date(iso);
  const f = (o: Intl.DateTimeFormatOptions) =>
    d.toLocaleString("en-GB", { ...o, timeZone: ZONA });
  const [dd, mm, yyyy] = f({ day: "2-digit", month: "2-digit", year: "numeric" }).split("/");
  const hhmm = f({ hour: "2-digit", minute: "2-digit", hour12: false });
  return `${yyyy}-${mm}-${dd}T${hhmm}`;
}
