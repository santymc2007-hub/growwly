import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Datos públicos para la navegación (menú del header, enlaces del
 * footer) — iguales para cualquier visitante, cambian poquísimo (solo
 * cuando el admin publica/despublica algo). Antes se consultaban en
 * cada carga de página, una vez desde el header y otra desde el
 * footer; con esto se cachean 5 minutos y dejan de ser un viaje a la
 * base de datos en cada request.
 */
export const tratamientosMenu = unstable_cache(
  async () => {
    const admin = createAdminClient();
    const { data } = await admin
      .from("tratamientos")
      .select("slug, nombre, categoria")
      .eq("publicado", true)
      .order("nombre", { ascending: true });
    return data ?? [];
  },
  ["tratamientos-menu"],
  { revalidate: 300 },
);

export const ciudadesConClinicas = unstable_cache(
  async () => {
    const admin = createAdminClient();
    const { data } = await admin
      .from("clinics")
      .select("ciudad, provincia")
      .eq("publicado", true)
      .eq("verificado_admin", true);

    const porCiudad = new Map<string, string>();
    for (const c of data ?? []) {
      if (c.ciudad && c.provincia && !porCiudad.has(c.ciudad)) {
        porCiudad.set(c.ciudad, c.provincia);
      }
    }
    return Array.from(porCiudad, ([ciudad, provincia]) => ({ ciudad, provincia })).sort((a, b) =>
      a.ciudad.localeCompare(b.ciudad, "es"),
    );
  },
  ["ciudades-con-clinicas"],
  { revalidate: 300 },
);
