import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { FONDO_ORIGINAL, normalizarFondo, type FondoWeb } from "./fondo-tipos";

export * from "./fondo-tipos";

/**
 * Lee el fondo actual. Si la tabla aún no existe o Supabase no responde,
 * devuelve el original: el fondo nunca debe romper una página.
 */
export const obtenerFondoWeb = cache(async (): Promise<FondoWeb> => {
  try {
    const { data, error } = await createAdminClient()
      .from("ajustes_web")
      .select("valor")
      .eq("clave", "fondo")
      .maybeSingle();
    if (error || !data) return FONDO_ORIGINAL;
    return normalizarFondo(data.valor);
  } catch {
    return FONDO_ORIGINAL;
  }
});
