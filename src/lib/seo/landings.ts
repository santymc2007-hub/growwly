import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  slugifyCiudad,
  slugifyProvincia,
  formatearPrecio,
  MUNICIPIOS_MALLORCA,
} from "@/lib/clinic-options";
import type { Clinic } from "@/lib/supabase/database.types";

/**
 * Landings tratamiento × lugar (/tratamientos/[slug]/[provincia] y
 * /tratamientos/[slug]/[provincia]/[ciudad]).
 *
 * No se crean a mano: salen solas de los datos. Una combinación solo
 * existe (y solo entra en el sitemap) si hay al menos MIN_CENTROS_LANDING
 * centros publicados y verificados que ofrecen esa técnica en ese lugar.
 * Así no hay páginas vacías ni casi vacías, y al dar de alta clínicas en
 * provincias nuevas aparecen sus landings sin tocar nada.
 */
export const MIN_CENTROS_LANDING = 2;

export type LugarLanding = {
  provincia: string;
  provinciaSlug: string;
  n: number;
  ciudades: { ciudad: string; ciudadSlug: string; n: number }[];
};

/** Todos los centros publicados que ofrecen una técnica. */
export const getCentrosConTecnica = cache(async (tecnica: string): Promise<Clinic[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clinics")
    .select("*")
    .eq("publicado", true)
    .eq("verificado_admin", true)
    .contains("tecnicas", [tecnica]);
  return data ?? [];
});

/** Provincias (y dentro, ciudades) con landing para una técnica. */
export function lugaresConLanding(centros: Clinic[]): LugarLanding[] {
  const porProvincia = new Map<string, Clinic[]>();
  for (const c of centros) {
    const lista = porProvincia.get(c.provincia) ?? [];
    lista.push(c);
    porProvincia.set(c.provincia, lista);
  }

  const lugares: LugarLanding[] = [];
  for (const [provincia, lista] of porProvincia) {
    if (lista.length < MIN_CENTROS_LANDING) continue;
    const porCiudad = new Map<string, number>();
    for (const c of lista) {
      if (c.ciudad) porCiudad.set(c.ciudad, (porCiudad.get(c.ciudad) ?? 0) + 1);
    }
    lugares.push({
      provincia,
      provinciaSlug: slugifyProvincia(provincia),
      n: lista.length,
      ciudades: [...porCiudad]
        .filter(([, n]) => n >= MIN_CENTROS_LANDING)
        .map(([ciudad, n]) => ({ ciudad, ciudadSlug: slugifyCiudad(ciudad), n }))
        .sort((a, b) => b.n - a.n),
    });
  }
  return lugares.sort((a, b) => b.n - a.n);
}

/** Todas las landings existentes, para el sitemap. */
export async function todasLasLandings(): Promise<string[]> {
  const supabase = await createClient();
  const [{ data: tratamientos }, { data: centros }] = await Promise.all([
    supabase
      .from("tratamientos")
      .select("slug, tecnica_relacionada")
      .eq("publicado", true)
      .not("tecnica_relacionada", "is", null),
    supabase
      .from("clinics")
      .select("*")
      .eq("publicado", true)
      .eq("verificado_admin", true),
  ]);

  const urls: string[] = [];
  for (const t of tratamientos ?? []) {
    const conTecnica = (centros ?? []).filter((c) =>
      c.tecnicas.includes(t.tecnica_relacionada as string),
    );
    for (const lugar of lugaresConLanding(conTecnica)) {
      urls.push(`/tratamientos/${t.slug}/${lugar.provinciaSlug}`);
      for (const ciudad of lugar.ciudades) {
        urls.push(`/tratamientos/${t.slug}/${lugar.provinciaSlug}/${ciudad.ciudadSlug}`);
      }
    }
  }
  return urls;
}

/**
 * "entre 1.500 € y 4.000 €" a partir de los precios publicados por los
 * centros. Ojo: precio_desde/precio_hasta son el rango GENERAL de cada
 * clínica, no el de un tratamiento. Por eso solo se usa en la ficha de una
 * clínica, nunca agregado en landings de tratamiento, provincia o ciudad
 * (salía "entre 2.000 € y 3.500 €" en la de PRP, que no cuadra).
 */
export function rangoPrecios(centros: Clinic[]): string | null {
  const desde = centros.map((c) => c.precio_desde).filter((p): p is number => p !== null);
  const hasta = centros.map((c) => c.precio_hasta).filter((p): p is number => p !== null);
  const min = desde.length > 0 ? Math.min(...desde) : null;
  const max = hasta.length > 0 ? Math.max(...hasta) : null;
  if (min !== null && max !== null) return `entre ${formatearPrecio(min)} y ${formatearPrecio(max)}`;
  if (min !== null) return `desde ${formatearPrecio(min)}`;
  if (max !== null) return `hasta ${formatearPrecio(max)}`;
  return null;
}

/** Recorta un texto a `max` caracteres sin cortar palabras. */
export function recortar(texto: string, max = 158): string {
  const limpio = texto.replace(/\s+/g, " ").trim();
  if (limpio.length <= max) return limpio;
  const corte = limpio.slice(0, max - 1);
  return `${corte.slice(0, corte.lastIndexOf(" ")).replace(/[,.;:]$/, "")}…`;
}

/** Técnicas más repetidas en un grupo de centros. */
export function tecnicasMasComunes(centros: Clinic[], n = 3): string[] {
  const cuenta = new Map<string, number>();
  for (const c of centros) for (const t of c.tecnicas) cuenta.set(t, (cuenta.get(t) ?? 0) + 1);
  return [...cuenta].sort((a, b) => b[1] - a[1]).slice(0, n).map(([t]) => t);
}

/**
 * Nombre del lugar tal como lo busca la gente: "Palma (Mallorca)" y
 * "Mallorca" en vez de "Illes Balears" mientras todos los centros de
 * la provincia estén en Mallorca (que es como se busca de verdad).
 */
export function nombreCiudadBuscable(ciudad: string, provincia: string): string {
  if (provincia === "Illes Balears" && (MUNICIPIOS_MALLORCA as readonly string[]).includes(ciudad)) {
    return `${ciudad} (Mallorca)`;
  }
  return ciudad;
}

export function nombreProvinciaBuscable(provincia: string, centros: Clinic[]): string {
  if (
    provincia === "Illes Balears" &&
    centros.length > 0 &&
    centros.every((c) => c.ciudad && (MUNICIPIOS_MALLORCA as readonly string[]).includes(c.ciudad))
  ) {
    return "Mallorca";
  }
  return provincia;
}

/** URL pública de una ficha (misma regla que ClinicCard). */
export function hrefFicha(c: Pick<Clinic, "provincia" | "ciudad" | "slug">): string {
  return `/centros/${slugifyProvincia(c.provincia)}/${c.ciudad ? slugifyCiudad(c.ciudad) : "sin-ciudad"}/${c.slug}`;
}

/**
 * Nombre de tratamiento dentro de una frase: "Injerto Capilar FUE" →
 * "injerto capilar FUE", "Finasteride / Dutasteride" → "finasteride /
 * dutasteride". Solo pasa a minúscula las palabras con mayúscula inicial;
 * las siglas ("FUE", "PRP", "DHI") se quedan igual.
 */
export function enFrase(nombre: string): string {
  return nombre.replace(/\p{Lu}\p{Ll}+/gu, (palabra) => palabra.toLowerCase());
}
