import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Lista de tratamientos publicados para el menú del header — igual
 * para cualquier visitante, cambia poquísimo (solo cuando el admin
 * publica/despublica uno). Antes se consultaba en cada carga de
 * página a través de `SiteHeader`; con esto se cachea 5 minutos y deja
 * de ser un viaje a la base de datos en cada request.
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
