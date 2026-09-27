import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { CONTENIDO_FLUJOS } from "./flujos";
import type { Flujo } from "./tipos";

const MAX_CLINICAS = 5;

/**
 * Match Score previo, para el informe. Todavía no hay solicitud de
 * presupuesto (el formulario va después), así que solo se puede cruzar
 * lo que ya sabemos: qué técnicas tiene sentido ofrecer para este flujo
 * y, si el paciente la puso al registrarse, su ciudad.
 *
 * Usa el mismo filtro de clínicas que el reparto real de leads
 * (publicada + verificada + plan premium), para no prometer clínicas
 * que luego no van a recibir la solicitud.
 */
export async function calcularMatchPrevio(
  supabase: SupabaseClient<Database>,
  flujo: Flujo,
  ciudadPaciente: string | null,
): Promise<{ pct: number; clinicas: number } | null> {
  const tecnicas = CONTENIDO_FLUJOS[flujo].tecnicas;

  const { data } = await supabase
    .from("clinics")
    .select("id, ciudad, tecnicas")
    .eq("publicado", true)
    .eq("verificado_admin", true)
    .eq("plan", "premium")
    .overlaps("tecnicas", tecnicas);

  const candidatas = data ?? [];
  if (candidatas.length === 0) return null;

  const ciudad = ciudadPaciente?.trim().toLowerCase() || null;
  const puntuaciones = candidatas.map((c) => {
    const coincidencias = c.tecnicas.filter((t) => tecnicas.includes(t)).length;
    // Con 2 técnicas del flujo ya cubre lo esencial; más no suma.
    const tecnica = Math.min(1, coincidencias / Math.min(2, tecnicas.length));
    const ubicacion = !ciudad ? 1 : c.ciudad?.toLowerCase() === ciudad ? 1 : 0.6;
    return Math.round(((tecnica + ubicacion) / 2) * 100);
  });

  puntuaciones.sort((a, b) => b - a);
  return { pct: puntuaciones[0], clinicas: Math.min(MAX_CLINICAS, puntuaciones.length) };
}
