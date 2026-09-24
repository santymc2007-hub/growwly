import type { Clinic, Database } from "@/lib/supabase/database.types";

type Solicitud = Database["public"]["Tables"]["solicitudes_presupuesto"]["Row"];

const RANGO_PRESUPUESTO: Record<string, { min: number; max: number }> = {
  menos_3000: { min: 0, max: 3000 },
  "3000_5000": { min: 3000, max: 5000 },
  "5000_7000": { min: 5000, max: 7000 },
  mas_7000: { min: 7000, max: Infinity },
};

function solapan(a: { min: number; max: number }, b: { min: number; max: number }): boolean {
  return a.min <= b.max && b.min <= a.max;
}

/**
 * Cuánto encaja UNA clínica concreta con UNA solicitud concreta — a
 * diferencia del Growwly Score (que mide cómo trabaja la clínica en
 * general, sin importar quién pregunta). Devuelve 0-100.
 *
 * Los factores de disponibilidad y preferencias finas del documento
 * no tienen todavía dato estructurado que comparar (llegarán con la
 * Propuesta en fases posteriores) — de momento se puntúa con lo que
 * ya existe: ubicación, tratamiento y presupuesto orientativo.
 */
export function calcularMatchScore(solicitud: Solicitud, clinic: Clinic): number {
  const factores: number[] = [];

  // Ubicación: si el paciente no pidió ceñirse a su ciudad, siempre encaja.
  factores.push(
    solicitud.donde_tratamiento !== "ciudad" ||
      !solicitud.ciudad ||
      (clinic.ciudad?.toLowerCase() === solicitud.ciudad.toLowerCase())
      ? 1
      : 0,
  );

  // Tratamiento: si deja decidir al médico, siempre encaja.
  factores.push(
    solicitud.dejar_decidir_medico || solicitud.tratamientos_interes.length === 0
      ? 1
      : solicitud.tratamientos_interes.some((t) => clinic.tecnicas.includes(t))
        ? 1
        : 0,
  );

  // Presupuesto orientativo: si falta alguno de los dos rangos, no se
  // puede comparar — no penaliza ni premia (0.5).
  const rangoSolicitud = solicitud.presupuesto_rango
    ? RANGO_PRESUPUESTO[solicitud.presupuesto_rango]
    : null;
  if (rangoSolicitud && clinic.precio_desde != null && clinic.precio_hasta != null) {
    factores.push(
      solapan(rangoSolicitud, { min: clinic.precio_desde, max: clinic.precio_hasta }) ? 1 : 0,
    );
  } else {
    factores.push(0.5);
  }

  const media = factores.reduce((a, b) => a + b, 0) / factores.length;
  return Math.round(media * 100);
}
