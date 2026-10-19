import type { SupabaseClient } from "@supabase/supabase-js";
import type { Clinic, Database } from "@/lib/supabase/database.types";
import { hash, diaDeHoy } from "@/lib/clinica/seleccion-portada";
import { ordenarListado } from "@/lib/clinica/orden-listado";
import {
  CAMPOS_DESTACADO,
  PLAZAS_DESTACADO_GENERAL,
  PLAZAS_DESTACADO_PROVINCIA,
  type Plazas,
  type TipoDestacado,
} from "./tipos";

// Solo servidor. Las reglas (qué destacado sale dónde y cuántas plazas
// hay) están explicadas en ./tipos.ts.
export * from "./tipos";

type Admin = SupabaseClient<Database>;

/**
 * Plazas ocupadas de un tipo de destacado (en una provincia, para el de
 * provincia). Cuenta las activas, publicadas o no: la plaza está
 * vendida igual.
 */
export async function plazasDestacado(
  admin: Admin,
  tipo: TipoDestacado,
  provincia: string | null,
): Promise<Plazas> {
  const total = tipo === "destacado" ? PLAZAS_DESTACADO_GENERAL : PLAZAS_DESTACADO_PROVINCIA;
  let consulta = admin
    .from("clinics")
    .select("id", { count: "exact", head: true })
    .eq(CAMPOS_DESTACADO[tipo].activo, true);
  if (tipo === "destacado_provincia") consulta = consulta.eq("provincia", provincia ?? "");
  const { count } = await consulta;
  const ocupadas = count ?? 0;
  return { ocupadas, total, libres: Math.max(0, total - ocupadas) };
}

/**
 * Orden de un listado público: primero los destacados que tocan (los
 * de esa provincia si hay provincia elegida; si no, los generales), en
 * un orden que rota cada día; después el resto por Growwly Score.
 * Devuelve también los ids que llevan la etiqueta «Destacado».
 */
export async function ordenarConDestacados<C extends Clinic>(
  clinicas: C[],
  provincia: string | null,
): Promise<{ clinicas: C[]; idsDestacados: string[] }> {
  const esDestacado = (c: C) =>
    provincia ? c.destacado_provincia && c.provincia === provincia : c.destacado;

  const dia = diaDeHoy();
  const destacados = clinicas
    .filter(esDestacado)
    .sort((a, b) => hash(`${a.id}:${dia}`) - hash(`${b.id}:${dia}`));
  const resto = await ordenarListado(
    clinicas.filter((c) => !esDestacado(c)),
    () => 0,
  );

  return {
    clinicas: [...destacados, ...resto],
    idsDestacados: destacados.map((c) => c.id),
  };
}
