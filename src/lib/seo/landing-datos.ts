import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { provinciaDesdeSlug, slugifyCiudad } from "@/lib/clinic-options";
import {
  getCentrosConTecnica,
  lugaresConLanding,
  MIN_CENTROS_LANDING,
} from "@/lib/seo/landings";

/** Datos de una landing tratamiento × lugar, o null si no debe existir. */
export const getLanding = cache(
  async (slug: string, provinciaSlug: string, ciudadSlug?: string) => {
    const provinciaReal = provinciaDesdeSlug(provinciaSlug);
    if (!provinciaReal) return null;

    const supabase = await createClient();
    const { data: tratamiento } = await supabase
      .from("tratamientos")
      .select("slug, nombre, resumen, tecnica_relacionada")
      .eq("slug", slug)
      .eq("publicado", true)
      .maybeSingle();
    if (!tratamiento?.tecnica_relacionada) return null;

    const todos = await getCentrosConTecnica(tratamiento.tecnica_relacionada);
    const enProvincia = todos.filter((c) => c.provincia === provinciaReal);
    const centros = ciudadSlug
      ? enProvincia.filter((c) => c.ciudad && slugifyCiudad(c.ciudad) === ciudadSlug)
      : enProvincia;
    if (centros.length < MIN_CENTROS_LANDING) return null;

    const lugar = lugaresConLanding(enProvincia)[0];
    return {
      tratamiento,
      provinciaReal,
      centros,
      ciudadReal: ciudadSlug ? centros[0].ciudad! : null,
      ciudades: lugar?.ciudades ?? [],
    };
  },
);
