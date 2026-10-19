import type { Clinic } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import { calcularGrowwlyScore } from "@/lib/leads/growwly-score";
import { calcularMetricasLeadsClinicas } from "@/lib/leads/metricas-clinica";

/**
 * Orden de los listados públicos (general, ciudad, tratamiento):
 * primero las posiciones de pago (las que indique `prioridad`, de menor
 * a mayor), y dentro de cada grupo por Growwly Score, y a igualdad por
 * nombre. Es lo que explica /como-ordenamos: si cambia aquí, cambiar
 * también esa página.
 *
 * `prioridad` devuelve 0 para lo que va más arriba (p. ej. destacado en
 * esta ciudad), 1 para lo siguiente, etc.
 */
export async function ordenarListado<C extends Clinic>(
  clinicas: C[],
  prioridad: (c: C) => number,
): Promise<C[]> {
  if (clinicas.length < 2) return clinicas;

  const metricas = await calcularMetricasLeadsClinicas(
    createAdminClient(),
    clinicas.map((c) => c.id),
  );
  const vacias = { tiempoRespuestaPromedioMinutos: null, tasaGestionLeads: null };

  return clinicas
    .map((c) => ({
      c,
      p: prioridad(c),
      score: calcularGrowwlyScore(c, metricas.get(c.id) ?? vacias).total,
    }))
    .sort(
      (a, b) => a.p - b.p || b.score - a.score || a.c.nombre.localeCompare(b.c.nombre, "es"),
    )
    .map((x) => x.c);
}
