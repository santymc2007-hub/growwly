import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { provinciaDesdeSlug, slugifyProvincia } from "@/lib/clinic-options";
import { getCentrosConTecnica, nombreProvinciaBuscable } from "@/lib/seo/landings";
import { MIN_CENTROS_RANKING, TEMA_GENERAL, ranking } from "@/lib/seo/mejores";
import type { Clinic } from "@/lib/supabase/database.types";

const getCentrosPublicos = cache(async (): Promise<Clinic[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clinics")
    .select("*")
    .eq("publicado", true)
    .eq("verificado_admin", true);
  return data ?? [];
});

export type DatosRanking = {
  tema: string;
  /** null = clínicas capilares en general. */
  tratamiento: { slug: string; nombre: string; resumen: string | null } | null;
  provinciaReal: string;
  provinciaSlug: string;
  lugar: string;
  totalCentros: number;
  filas: ReturnType<typeof ranking>;
};

/** Datos de una página de ranking, o null si no debe existir. */
export const getRanking = cache(
  async (tema: string, provinciaSlug: string): Promise<DatosRanking | null> => {
    const provinciaReal = provinciaDesdeSlug(provinciaSlug);
    if (!provinciaReal) return null;

    let tratamiento: DatosRanking["tratamiento"] = null;
    let centros: Clinic[];
    if (tema === TEMA_GENERAL) {
      centros = await getCentrosPublicos();
    } else {
      const supabase = await createClient();
      const { data: t } = await supabase
        .from("tratamientos")
        .select("slug, nombre, resumen, tecnica_relacionada")
        .eq("slug", tema)
        .eq("publicado", true)
        .maybeSingle();
      if (!t?.tecnica_relacionada) return null;
      tratamiento = { slug: t.slug, nombre: t.nombre, resumen: t.resumen };
      centros = await getCentrosConTecnica(t.tecnica_relacionada);
    }

    const enProvincia = centros.filter((c) => c.provincia === provinciaReal);
    if (enProvincia.length < MIN_CENTROS_RANKING) return null;

    return {
      tema,
      tratamiento,
      provinciaReal,
      provinciaSlug,
      lugar: nombreProvinciaBuscable(provinciaReal, enProvincia),
      totalCentros: enProvincia.length,
      filas: ranking(enProvincia),
    };
  },
);

/** Todas las páginas de ranking que existen (sitemap y enlaces). */
export async function todasLasPaginasRanking(): Promise<string[]> {
  const supabase = await createClient();
  const [centros, { data: tratamientos }] = await Promise.all([
    getCentrosPublicos(),
    supabase
      .from("tratamientos")
      .select("slug, tecnica_relacionada")
      .eq("publicado", true)
      .not("tecnica_relacionada", "is", null),
  ]);

  const porProvincia = (lista: Clinic[]) => {
    const cuenta = new Map<string, number>();
    for (const c of lista) cuenta.set(c.provincia, (cuenta.get(c.provincia) ?? 0) + 1);
    return [...cuenta].filter(([, n]) => n >= MIN_CENTROS_RANKING).map(([p]) => slugifyProvincia(p));
  };

  const urls = porProvincia(centros).map((p) => `/mejores/${TEMA_GENERAL}/${p}`);
  for (const t of tratamientos ?? []) {
    const conTecnica = centros.filter((c) => c.tecnicas.includes(t.tecnica_relacionada as string));
    for (const p of porProvincia(conTecnica)) urls.push(`/mejores/${t.slug}/${p}`);
  }
  return urls;
}

/** ¿Existe ranking para este tratamiento (o general) en esta provincia? */
export function hrefRanking(tema: string, provinciaSlug: string): string {
  return `/mejores/${tema}/${provinciaSlug}`;
}
