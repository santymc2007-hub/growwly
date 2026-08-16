import { createClient } from "@/lib/supabase/server";
import { calcularCompletitud } from "./completitud";
import type { Clinic } from "@/lib/supabase/database.types";

const UMBRAL_COMPLETITUD = 60;

function numeroDeSemanaISO(fecha: Date): number {
  const d = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()));
  const diaSemana = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - diaSemana);
  const inicioAno = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - inicioAno.getTime()) / 86400000 + 1) / 7);
}

/**
 * Elige la "clínica de la semana" de una provincia, de forma
 * determinista: mismo resultado toda la semana, cambia sola la
 * siguiente, sin necesitar cron ni guardar ningún estado. Preparado
 * para cuando haya más provincias activas — cada una tiene su propia
 * elegible/ganadora, sin tocar código al abrir una nueva.
 */
export async function obtenerClinicaDeLaSemana(
  provincia: string,
): Promise<Clinic | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clinics")
    .select("*")
    .eq("provincia", provincia)
    .eq("publicado", true)
    .eq("plan", "premium")
    .order("id", { ascending: true }); // orden estable para que el índice no salte

  const elegibles = (data ?? []).filter(
    (c) => calcularCompletitud(c) >= UMBRAL_COMPLETITUD,
  );

  if (elegibles.length === 0) return null;

  const semana = numeroDeSemanaISO(new Date());
  const indice = semana % elegibles.length;
  return elegibles[indice];
}
