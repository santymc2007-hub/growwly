import type { Clinic } from "@/lib/supabase/database.types";

export const PLAZAS_PORTADA = 8;

/** Hash FNV-1a de 32 bits: barato y estable entre despliegues. */
export function hash(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Día del calendario en Madrid ("2026-10-16"): el sorteo cambia a medianoche de aquí. */
export function diaDeHoy(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date());
}

/**
 * Rellena los huecos de la sección de centros de la portada cuando no
 * hay suficientes centros que paguen por salir ahí.
 *
 * - Los de pago (Destacado general, 8 plazas) van primero, en un orden
 *   que rota cada día, y son los únicos con etiqueta «Destacado».
 * - El resto se sortea entre los centros publicados y verificados: el
 *   sorteo es determinista por día (mismo resultado todo el día,
 *   cambia solo al siguiente, sin cron ni estado guardado).
 * - Entre los no pagados, primero los que tienen foto: una tarjeta sin
 *   foto en portada luce mal.
 */
export function seleccionarPortada(
  pagados: Clinic[],
  candidatos: Clinic[],
): { pagados: Clinic[]; relleno: Clinic[] } {
  const dia = diaDeHoy();
  // Entre los de pago, el orden también rota cada día: todos pasan por
  // la primera posición.
  const enPortada = [...pagados]
    .sort((a, b) => hash(`${a.id}:${dia}`) - hash(`${b.id}:${dia}`))
    .slice(0, PLAZAS_PORTADA);
  const huecos = PLAZAS_PORTADA - enPortada.length;
  if (huecos <= 0) return { pagados: enPortada, relleno: [] };

  const ya = new Set(enPortada.map((c) => c.id));
  const sorteados = candidatos
    .filter((c) => !ya.has(c.id))
    .map((c) => ({ c, conFoto: c.fotos.length > 0 ? 0 : 1, orden: hash(`${c.id}:${dia}`) }))
    .sort((a, b) => a.conFoto - b.conFoto || a.orden - b.orden)
    .slice(0, huecos)
    .map((x) => x.c);

  return { pagados: enPortada, relleno: sorteados };
}
