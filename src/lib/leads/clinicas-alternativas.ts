import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { calcularMetricasLeadsClinicas } from "@/lib/leads/metricas-clinica";

export type ClinicaAlternativa = {
  id: string;
  nombre: string;
  ciudad: string | null;
  ratingGoogle: number | null;
  resenasGoogle: number | null;
  fotoUrl: string | null;
  tiempoRespuestaPromedioMinutos: number | null;
};

const MAX_ALTERNATIVAS = 3;

/**
 * Clínicas que se le ofrecen al paciente cuando la que eligió no
 * responde (Punto 3 del plan Básico/Premium) — misma ciudad,
 * priorizando tiempo de respuesta medio y, si no hay dato, valoración
 * de Google. Reutiliza calcularMetricasLeadsClinicas, el mismo
 * "tiempo de respuesta" que ya alimenta el Growwly Score.
 */
export async function buscarClinicasAlternativas(
  supabaseAdmin: SupabaseClient<Database>,
  params: { ciudad: string | null; excluirClinicId: string },
): Promise<ClinicaAlternativa[]> {
  if (!params.ciudad) return [];

  const { data: candidatas } = await supabaseAdmin
    .from("clinics")
    .select("id, nombre, ciudad, rating_google, resenas_google, fotos")
    .eq("ciudad", params.ciudad)
    .eq("publicado", true)
    .eq("verificado_admin", true)
    .not("email", "is", null)
    .neq("id", params.excluirClinicId);

  const lista = candidatas ?? [];
  if (lista.length === 0) return [];

  const metricas = await calcularMetricasLeadsClinicas(
    supabaseAdmin,
    lista.map((c) => c.id),
  );

  const ordenadas = [...lista].sort((a, b) => {
    const tA = metricas.get(a.id)?.tiempoRespuestaPromedioMinutos ?? null;
    const tB = metricas.get(b.id)?.tiempoRespuestaPromedioMinutos ?? null;
    if (tA !== null && tB !== null && tA !== tB) return tA - tB;
    if (tA !== null && tB === null) return -1;
    if (tA === null && tB !== null) return 1;
    return (b.rating_google ?? 0) - (a.rating_google ?? 0);
  });

  return ordenadas.slice(0, MAX_ALTERNATIVAS).map((c) => ({
    id: c.id,
    nombre: c.nombre,
    ciudad: c.ciudad,
    ratingGoogle: c.rating_google,
    resenasGoogle: c.resenas_google,
    fotoUrl: c.fotos?.[0] ?? null,
    tiempoRespuestaPromedioMinutos:
      metricas.get(c.id)?.tiempoRespuestaPromedioMinutos ?? null,
  }));
}
